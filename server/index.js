require('dotenv').config()

const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const redis = require('./redisClient')
const { connectMongo } = require('./mongo')
const { enqueueAndTryMatch, removeFromQueue } = require('./matchmaker')
const User = require('./models/User')
const { hashPassword, verifyPassword, createToken, requireAuth } = require('./auth')

const PORT = process.env.PORT || 4000
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim())
const CLIENT_ORIGIN = CLIENT_ORIGINS.length === 1 ? CLIENT_ORIGINS[0] : CLIENT_ORIGINS

const app = express()
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || CLIENT_ORIGINS.includes(origin)),
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!name?.trim() || !normalizedEmail || !password) return res.status(400).json({ message: 'Name, email, and password are required.' })
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Enter a valid email address.' })
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with that email already exists.' })
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await hashPassword(password) })
    res.status(201).json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) {
    res.status(503).json({ message: 'Account service is unavailable. Check your MongoDB connection.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const user = await User.findOne({ email })
    if (!user || !(await verifyPassword(req.body.password || '', user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' })
    res.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) {
    res.status(503).json({ message: 'Account service is unavailable. Check your MongoDB connection.' })
  }
})

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('name email')
    if (!user) return res.status(401).json({ message: 'Account not found.' })
    res.json({ user: { id: user._id, name: user.name, email: user.email } })
  } catch {
    res.status(401).json({ message: 'Please log in again.' })
  }
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ['GET', 'POST'],
  },
})

const socketToRoom = new Map()

const blockedTerms = [/spam/i, /scam/i]

function isAllowedMessage(text) {
  return !blockedTerms.some((pattern) => pattern.test(text))
}

function getPartnerSocketId(ioServer, roomId, socketId) {
  const room = ioServer.sockets.adapter.rooms.get(roomId)
  if (!room) return null

  for (const memberId of room) {
    if (memberId !== socketId) {
      return memberId
    }
  }

  return null
}

async function joinQueue(socket) {
  const match = await enqueueAndTryMatch(redis, socket.id)

  if (!match) {
    socket.emit('matching')
    return
  }

  const socketA = io.sockets.sockets.get(match.userA)
  const socketB = io.sockets.sockets.get(match.userB)

  if (!socketA || !socketB) {
    if (socketA && socketA.connected) {
      await enqueueAndTryMatch(redis, socketA.id)
    }
    if (socketB && socketB.connected) {
      await enqueueAndTryMatch(redis, socketB.id)
    }
    return
  }

  socketA.join(match.roomId)
  socketB.join(match.roomId)

  socketToRoom.set(socketA.id, match.roomId)
  socketToRoom.set(socketB.id, match.roomId)

  socketA.emit('match-found', {
    roomId: match.roomId,
    role: 'initiator',
    partnerSocketId: socketB.id,
  })

  socketB.emit('match-found', {
    roomId: match.roomId,
    role: 'receiver',
    partnerSocketId: socketA.id,
  })
}

async function leaveCurrentRoom(socket, requeue = false) {
  const roomId = socketToRoom.get(socket.id)
  if (!roomId) {
    if (requeue) {
      await joinQueue(socket)
    }
    return
  }

  const partnerId = getPartnerSocketId(io, roomId, socket.id)
  socket.leave(roomId)
  socketToRoom.delete(socket.id)

  if (partnerId) {
    io.to(partnerId).emit('peer-left')
    socketToRoom.delete(partnerId)
    io.sockets.sockets.get(partnerId)?.leave(roomId)
  }

  if (requeue) {
    await joinQueue(socket)
  }
}

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('join-queue', async () => {
    await removeFromQueue(redis, socket.id)
    await joinQueue(socket)
  })

  socket.on('send-message', ({ roomId, message }) => {
    if (!roomId || typeof message !== 'string') return
    if (!isAllowedMessage(message)) {
      socket.emit('message-blocked', { reason: 'Message failed moderation.' })
      return
    }

    io.to(roomId).emit('chat-message', {
      sender: socket.id,
      text: message.trim(),
      createdAt: Date.now(),
    })
  })

  socket.on('leave-room', async () => {
    await leaveCurrentRoom(socket, false)
  })

  socket.on('next-peer', async () => {
    await leaveCurrentRoom(socket, true)
  })

  socket.on('relay-offer', ({ roomId, offer }) => {
    if (!roomId || !offer) return
    socket.to(roomId).emit('webrtc-offer', { offer })
  })

  socket.on('relay-answer', ({ roomId, answer }) => {
    if (!roomId || !answer) return
    socket.to(roomId).emit('webrtc-answer', { answer })
  })

  socket.on('relay-ice-candidate', ({ roomId, candidate }) => {
    if (!roomId || !candidate) return
    socket.to(roomId).emit('webrtc-ice-candidate', { candidate })
  })

  socket.on('disconnect', async () => {
    await removeFromQueue(redis, socket.id)
    await leaveCurrentRoom(socket, false)
    console.log('Socket disconnected:', socket.id)
  })
})

server.listen(PORT, async () => {
  await connectMongo()
  console.log(`Server listening on port ${PORT}`)
})
