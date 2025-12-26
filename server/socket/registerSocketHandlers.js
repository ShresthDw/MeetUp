const { enqueueAndTryMatch, removeFromQueue } = require('../matchmaker')

const blockedTerms = [/spam/i, /scam/i]

function registerSocketHandlers(io, redis) {
  const socketToRoom = new Map()

  const isAllowedMessage = (text) => !blockedTerms.some((pattern) => pattern.test(text))

  const broadcastLiveStats = () => {
    const onlineCount = io.engine?.clientsCount || io.sockets.sockets.size || 1
    const inRoomsCount = socketToRoom.size
    io.emit('online-stats', {
      onlineCount,
      inRoomsCount,
      timestamp: Date.now(),
    })
  }

  const getPartnerSocketId = (roomId, socketId) => {
    const room = io.sockets.adapter.rooms.get(roomId)
    if (!room) return null

    return [...room].find((memberId) => memberId !== socketId) || null
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
      if (socketA?.connected) await enqueueAndTryMatch(redis, socketA.id)
      if (socketB?.connected) await enqueueAndTryMatch(redis, socketB.id)
      return
    }

    socketA.join(match.roomId)
    socketB.join(match.roomId)
    socketToRoom.set(socketA.id, match.roomId)
    socketToRoom.set(socketB.id, match.roomId)

    socketA.emit('match-found', { roomId: match.roomId, role: 'initiator', partnerSocketId: socketB.id })
    socketB.emit('match-found', { roomId: match.roomId, role: 'receiver', partnerSocketId: socketA.id })
    broadcastLiveStats()
  }

  async function leaveCurrentRoom(socket, requeue = false) {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) {
      if (requeue) await joinQueue(socket)
      return
    }

    const partnerId = getPartnerSocketId(roomId, socket.id)
    socket.leave(roomId)
    socketToRoom.delete(socket.id)

    if (partnerId) {
      io.to(partnerId).emit('peer-left')
      socketToRoom.delete(partnerId)
      io.sockets.sockets.get(partnerId)?.leave(roomId)
    }

    broadcastLiveStats()
    if (requeue) await joinQueue(socket)
  }

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    // Send immediate real-time stats to the newly connected socket
    const currentOnline = io.engine?.clientsCount || io.sockets.sockets.size || 1
    socket.emit('online-stats', {
      onlineCount: currentOnline,
      inRoomsCount: socketToRoom.size,
      timestamp: Date.now(),
    })

    // Broadcast updated count to all other clients
    broadcastLiveStats()

    socket.on('get-stats', () => {
      const liveCount = io.engine?.clientsCount || io.sockets.sockets.size || 1
      socket.emit('online-stats', {
        onlineCount: liveCount,
        inRoomsCount: socketToRoom.size,
        timestamp: Date.now(),
      })
    })

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

    socket.on('leave-room', () => leaveCurrentRoom(socket))
    socket.on('next-peer', () => leaveCurrentRoom(socket, true))
    socket.on('relay-offer', ({ roomId, offer }) => {
      if (roomId && offer) socket.to(roomId).emit('webrtc-offer', { offer })
    })
    socket.on('relay-answer', ({ roomId, answer }) => {
      if (roomId && answer) socket.to(roomId).emit('webrtc-answer', { answer })
    })
    socket.on('relay-ice-candidate', ({ roomId, candidate }) => {
      if (roomId && candidate) socket.to(roomId).emit('webrtc-ice-candidate', { candidate })
    })

    socket.on('disconnect', async () => {
      await removeFromQueue(redis, socket.id)
      await leaveCurrentRoom(socket)
      console.log('Socket disconnected:', socket.id)
      broadcastLiveStats()
    })
  })
}

module.exports = { registerSocketHandlers }
