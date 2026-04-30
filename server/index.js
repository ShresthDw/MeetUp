require('dotenv').config()

const cors = require('cors')
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const redis = require('./redisClient')
const { connectMongo } = require('./mongo')
const { clientOrigins, port } = require('./config/env')
const authRoutes = require('./routes/authRoutes')
const { registerSocketHandlers } = require('./socket/registerSocketHandlers')

const app = express()

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || clientOrigins.includes(origin)),
  credentials: true,
}))
app.use(express.json({ limit: '32kb' }))

app.get('/health', (_, res) => res.json({ status: 'ok' }))
app.get('/api/stats', (_, res) => {
  const onlineCount = io?.engine?.clientsCount || io?.sockets?.sockets?.size || 0
  res.json({ onlineCount, timestamp: Date.now() })
})
app.use('/api/auth', authRoutes)
app.use((error, _req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large.' })
  }
  return next(error)
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: clientOrigins,
    methods: ['GET', 'POST'],
  },
})

registerSocketHandlers(io, redis)

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
  connectMongo()
})
