const {
  enqueueAndTryMatch,
  removeFromQueue,
  enqueueOrJoinPublicGroup,
  createCustomGroupRoom,
  joinSpecificGroupRoom,
  leaveGroupRoom,
} = require('../matchmaker')

const blockedTerms = [/spam/i, /scam/i]

function registerSocketHandlers(io, redis) {
  const socketToRoom = new Map()
  const socketToPartner = new Map()

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
    if (socketToPartner.has(socketId)) {
      return socketToPartner.get(socketId)
    }
    if (!roomId) return null
    const room = io.sockets.adapter.rooms.get(roomId)
    if (!room) return null

    return [...room].find((memberId) => memberId !== socketId) || null
  }

  async function joinQueue(socket) {
    if (!socket || !socket.connected) return

    const match = await enqueueAndTryMatch(redis, socket.id)
    if (!match) {
      socket.emit('matching')
      return
    }

    if (match.userA === match.userB) {
      await removeFromQueue(redis, socket.id)
      socket.emit('matching')
      return
    }

    const socketA = io.sockets.sockets.get(match.userA)
    const socketB = io.sockets.sockets.get(match.userB)

    if (!socketA || !socketB || !socketA.connected || !socketB.connected) {
      if (socketA && socketA.connected) {
        socketA.emit('matching')
        await joinQueue(socketA)
      } else if (match.userA) {
        await removeFromQueue(redis, match.userA)
      }

      if (socketB && socketB.connected) {
        socketB.emit('matching')
        await joinQueue(socketB)
      } else if (match.userB) {
        await removeFromQueue(redis, match.userB)
      }
      return
    }

    socketA.join(match.roomId)
    socketB.join(match.roomId)
    socketToRoom.set(socketA.id, match.roomId)
    socketToRoom.set(socketB.id, match.roomId)
    socketToPartner.set(socketA.id, socketB.id)
    socketToPartner.set(socketB.id, socketA.id)

    socketA.emit('match-found', { roomId: match.roomId, role: 'initiator', partnerSocketId: socketB.id })
    socketB.emit('match-found', { roomId: match.roomId, role: 'receiver', partnerSocketId: socketA.id })
    broadcastLiveStats()
  }

  async function leaveCurrentRoom(socket, requeue = false) {
    await removeFromQueue(redis, socket.id)
    const roomId = socketToRoom.get(socket.id)
    const partnerId = socketToPartner.get(socket.id) || (roomId ? getPartnerSocketId(roomId, socket.id) : null)

    if (roomId) {
      socket.leave(roomId)
    }
    socketToRoom.delete(socket.id)
    socketToPartner.delete(socket.id)

    if (partnerId) {
      io.to(partnerId).emit('peer-left')
      socketToRoom.delete(partnerId)
      socketToPartner.delete(partnerId)
      if (roomId) {
        io.sockets.sockets.get(partnerId)?.leave(roomId)
      }
    }

    broadcastLiveStats()
    if (requeue && socket.connected) {
      await joinQueue(socket)
    }
  }

  function handleLeaveGroupRoom(socket) {
    const leftInfo = leaveGroupRoom(socket.id)
    if (leftInfo) {
      socket.leave(leftInfo.roomId)
      io.to(leftInfo.roomId).emit('group-peer-left', { peerSocketId: socket.id })
    }
  }

  io.on('connection', (socket) => {
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

    // ==========================================
    // 1-on-1 DUO ROOM HANDLERS
    // ==========================================
    socket.on('join-queue', async () => {
      handleLeaveGroupRoom(socket)
      await removeFromQueue(redis, socket.id)
      await joinQueue(socket)
    })

    socket.on('send-message', ({ roomId, message }) => {
      const activeRoomId = roomId || socketToRoom.get(socket.id)
      if (!activeRoomId || typeof message !== 'string') return
      if (!isAllowedMessage(message)) {
        socket.emit('message-blocked', { reason: 'Message failed moderation.' })
        return
      }

      io.to(activeRoomId).emit('chat-message', {
        sender: socket.id,
        text: message.trim(),
        createdAt: Date.now(),
      })
    })

    socket.on('leave-room', () => leaveCurrentRoom(socket))
    socket.on('next-peer', () => leaveCurrentRoom(socket, true))

    socket.on('relay-offer', ({ roomId, offer }) => {
      const activeRoomId = roomId || socketToRoom.get(socket.id)
      const partnerId = socketToPartner.get(socket.id) || (activeRoomId ? getPartnerSocketId(activeRoomId, socket.id) : null)
      if (offer) {
        if (activeRoomId) {
          socket.to(activeRoomId).emit('webrtc-offer', { offer })
        } else if (partnerId) {
          io.to(partnerId).emit('webrtc-offer', { offer })
        }
      }
    })

    socket.on('relay-answer', ({ roomId, answer }) => {
      const activeRoomId = roomId || socketToRoom.get(socket.id)
      const partnerId = socketToPartner.get(socket.id) || (activeRoomId ? getPartnerSocketId(activeRoomId, socket.id) : null)
      if (answer) {
        if (activeRoomId) {
          socket.to(activeRoomId).emit('webrtc-answer', { answer })
        } else if (partnerId) {
          io.to(partnerId).emit('webrtc-answer', { answer })
        }
      }
    })

    socket.on('relay-ice-candidate', ({ roomId, candidate }) => {
      const activeRoomId = roomId || socketToRoom.get(socket.id)
      const partnerId = socketToPartner.get(socket.id) || (activeRoomId ? getPartnerSocketId(activeRoomId, socket.id) : null)
      if (candidate) {
        if (activeRoomId) {
          socket.to(activeRoomId).emit('webrtc-ice-candidate', { candidate })
        } else if (partnerId) {
          io.to(partnerId).emit('webrtc-ice-candidate', { candidate })
        }
      }
    })

    socket.on('sync-theme', (payload) => {
      const activeRoomId = payload?.roomId || socketToRoom.get(socket.id)
      const partnerId = socketToPartner.get(socket.id) || (activeRoomId ? getPartnerSocketId(activeRoomId, socket.id) : null)
      const theme = payload?.theme
      if (theme === 'dark' || theme === 'light') {
        if (activeRoomId) {
          socket.to(activeRoomId).emit('theme-synced', { theme, sender: socket.id })
        } else if (partnerId) {
          io.to(partnerId).emit('theme-synced', { theme, sender: socket.id })
        }
      }
    })

    // ==========================================
    // GROUP LOUNGE HANDLERS (Mesh WebRTC)
    // ==========================================
    socket.on('join-group-queue', async () => {
      await leaveCurrentRoom(socket)
      const match = await enqueueOrJoinPublicGroup(socket.id)
      if (!match) return

      socket.join(match.roomId)
      socket.emit('group-matched', {
        roomId: match.roomId,
        roomCode: match.roomCode,
        members: match.members,
        isNew: match.isNew,
      })

      // Notify other group members in the room that a new peer joined
      socket.to(match.roomId).emit('group-peer-joined', {
        peerSocketId: socket.id,
        roomId: match.roomId,
      })
      broadcastLiveStats()
    })

    socket.on('create-custom-group', async () => {
      await leaveCurrentRoom(socket)
      const match = await createCustomGroupRoom(socket.id)
      if (!match) return

      socket.join(match.roomId)
      socket.emit('group-matched', {
        roomId: match.roomId,
        roomCode: match.roomCode,
        members: match.members,
        isNew: true,
      })
      broadcastLiveStats()
    })

    socket.on('join-specific-group', async ({ roomCode }) => {
      await leaveCurrentRoom(socket)
      const result = await joinSpecificGroupRoom(roomCode, socket.id)
      if (!result.success) {
        socket.emit('group-error', { reason: result.reason || 'Could not join group room.' })
        return
      }

      socket.join(result.roomId)
      socket.emit('group-matched', {
        roomId: result.roomId,
        roomCode: result.roomCode,
        members: result.members,
        isNew: result.isNew,
      })

      socket.to(result.roomId).emit('group-peer-joined', {
        peerSocketId: socket.id,
        roomId: result.roomId,
      })
      broadcastLiveStats()
    })

    socket.on('leave-group-room', () => {
      handleLeaveGroupRoom(socket)
      broadcastLiveStats()
    })

    socket.on('next-group', async () => {
      handleLeaveGroupRoom(socket)
      const match = await enqueueOrJoinPublicGroup(socket.id)
      if (!match) return

      socket.join(match.roomId)
      socket.emit('group-matched', {
        roomId: match.roomId,
        roomCode: match.roomCode,
        members: match.members,
        isNew: match.isNew,
      })

      socket.to(match.roomId).emit('group-peer-joined', {
        peerSocketId: socket.id,
        roomId: match.roomId,
      })
      broadcastLiveStats()
    })

    // Targeted Group Mesh Signaling
    socket.on('relay-group-offer', ({ to, offer }) => {
      if (to && offer) {
        io.to(to).emit('group-webrtc-offer', { from: socket.id, offer })
      }
    })

    socket.on('relay-group-answer', ({ to, answer }) => {
      if (to && answer) {
        io.to(to).emit('group-webrtc-answer', { from: socket.id, answer })
      }
    })

    socket.on('relay-group-ice-candidate', ({ to, candidate }) => {
      if (to && candidate) {
        io.to(to).emit('group-webrtc-ice-candidate', { from: socket.id, candidate })
      }
    })

    socket.on('relay-group-status', ({ roomId, isCameraOff, isMicMuted }) => {
      if (roomId) {
        socket.to(roomId).emit('group-peer-status-update', {
          peerSocketId: socket.id,
          isCameraOff,
          isMicMuted,
        })
      }
    })

    socket.on('send-group-message', ({ roomId, message, senderLabel }) => {
      if (!roomId || typeof message !== 'string') return
      if (!isAllowedMessage(message)) {
        socket.emit('message-blocked', { reason: 'Message failed moderation.' })
        return
      }

      io.to(roomId).emit('group-chat-message', {
        sender: socket.id,
        senderLabel: senderLabel || 'Stranger',
        text: message.trim(),
        createdAt: Date.now(),
      })
    })

    socket.on('disconnect', async () => {
      handleLeaveGroupRoom(socket)
      await removeFromQueue(redis, socket.id)
      await leaveCurrentRoom(socket)
      broadcastLiveStats()
    })
  })
}

module.exports = { registerSocketHandlers }


