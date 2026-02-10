const { randomUUID } = require('crypto')

const WAITING_QUEUE_KEY = 'waiting_queue'

// In-memory queue fallback in case Redis has network hiccups
const inMemoryQueue = []

const enqueueAndPopPairLua = `
  redis.call('LREM', KEYS[1], 0, ARGV[1])
  redis.call('RPUSH', KEYS[1], ARGV[1])
  local len = redis.call('LLEN', KEYS[1])
  if len >= 2 then
    local first = redis.call('LPOP', KEYS[1])
    local second = redis.call('LPOP', KEYS[1])
    if first and second and first ~= second then
      return { first, second }
    elseif first and (not second or first == second) then
      redis.call('RPUSH', KEYS[1], first)
    end
  end
  return {}
`

async function enqueueAndTryMatch(redis, socketId) {
  if (!socketId) return null

  if (redis && redis.status === 'ready') {
    try {
      const result = await redis.eval(enqueueAndPopPairLua, 1, WAITING_QUEUE_KEY, socketId)
      if (Array.isArray(result) && result.length === 2 && result[0] && result[1] && result[0] !== result[1]) {
        return {
          userA: result[0],
          userB: result[1],
          roomId: randomUUID(),
        }
      }
      return null
    } catch (err) {
      console.warn('Redis matchmaking error, falling back to in-memory queue:', err.message)
    }
  }

  // In-memory fallback
  const existingIdx = inMemoryQueue.indexOf(socketId)
  if (existingIdx !== -1) {
    inMemoryQueue.splice(existingIdx, 1)
  }
  inMemoryQueue.push(socketId)

  if (inMemoryQueue.length >= 2) {
    const userA = inMemoryQueue.shift()
    const userB = inMemoryQueue.shift()
    if (userA && userB && userA !== userB) {
      return {
        userA,
        userB,
        roomId: randomUUID(),
      }
    }
    if (userA) inMemoryQueue.unshift(userA)
  }

  return null
}

async function removeFromQueue(redis, socketId) {
  if (!socketId) return

  // Remove from in-memory queue
  const idx = inMemoryQueue.indexOf(socketId)
  if (idx !== -1) {
    inMemoryQueue.splice(idx, 1)
  }

  // Remove from Redis queue
  if (redis && redis.status === 'ready') {
    try {
      await redis.lrem(WAITING_QUEUE_KEY, 0, socketId)
    } catch (err) {
      // ignore
    }
  }
}

// Active Group Rooms Storage
const MAX_GROUP_CAPACITY = 6
const publicGroupRooms = new Map() // roomId -> { roomId, roomCode, members: Set(socketIds), createdAt }
const allGroupRoomsByCode = new Map() // normalizedCode -> room object
const socketToGroupRoom = new Map() // socketId -> roomId

function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `GRP-${code}`
}

function normalizeCode(code) {
  if (!code) return ''
  return String(code).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

function registerRoomInIndex(room) {
  if (!room) return
  const normCode = normalizeCode(room.roomCode)
  const normId = normalizeCode(room.roomId)
  const plainCode = normalizeCode(room.roomCode.replace(/^GRP-/, ''))

  if (normCode) allGroupRoomsByCode.set(normCode, room)
  if (plainCode) allGroupRoomsByCode.set(plainCode, room)
  if (normId) allGroupRoomsByCode.set(normId, room)
}

function unregisterRoomFromIndex(room) {
  if (!room) return
  const normCode = normalizeCode(room.roomCode)
  const normId = normalizeCode(room.roomId)
  const plainCode = normalizeCode(room.roomCode.replace(/^GRP-/, ''))

  if (normCode) allGroupRoomsByCode.delete(normCode)
  if (plainCode) allGroupRoomsByCode.delete(plainCode)
  if (normId) allGroupRoomsByCode.delete(normId)
}

function findRoomByCode(codeOrId) {
  if (!codeOrId) return null
  const normalized = normalizeCode(codeOrId)
  if (!normalized) return null

  const plain = normalizeCode(normalized.replace(/^GRP-/, ''))
  const withPrefix = normalized.startsWith('GRP-') ? normalized : `GRP-${normalized}`

  return (
    allGroupRoomsByCode.get(normalized) ||
    allGroupRoomsByCode.get(withPrefix) ||
    allGroupRoomsByCode.get(plain) ||
    publicGroupRooms.get(codeOrId) ||
    null
  )
}

async function enqueueOrJoinPublicGroup(socketId, maxMembers = MAX_GROUP_CAPACITY) {
  if (!socketId) return null

  // Check if socket is already in a group room and remove first
  leaveGroupRoom(socketId)

  // Find an existing public room with space
  for (const [roomId, room] of publicGroupRooms.entries()) {
    if (room.members.size > 0 && room.members.size < maxMembers && !room.members.has(socketId)) {
      const existingMembers = Array.from(room.members)
      room.members.add(socketId)
      if (!room.hostSocketId) {
        room.hostSocketId = existingMembers[0] || socketId
      }
      socketToGroupRoom.set(socketId, roomId)
      return {
        roomId: room.roomId,
        roomCode: room.roomCode,
        members: existingMembers,
        isNew: false,
        hostSocketId: room.hostSocketId,
      }
    }
  }

  // Otherwise, create a new public group room
  const roomId = randomUUID()
  const roomCode = generateGroupCode()
  const room = {
    roomId,
    roomCode,
    isPublic: true,
    hostSocketId: socketId,
    members: new Set([socketId]),
    createdAt: Date.now(),
  }

  publicGroupRooms.set(roomId, room)
  registerRoomInIndex(room)
  socketToGroupRoom.set(socketId, roomId)

  return {
    roomId,
    roomCode,
    members: [],
    isNew: true,
    hostSocketId: socketId,
  }
}

async function createCustomGroupRoom(socketId, maxMembers = MAX_GROUP_CAPACITY, customCode = null) {
  if (!socketId) return null
  leaveGroupRoom(socketId)

  let roomCode
  if (customCode && normalizeCode(customCode)) {
    const norm = normalizeCode(customCode)
    roomCode = norm.startsWith('GRP-') ? norm : `GRP-${norm}`
  } else {
    roomCode = generateGroupCode()
  }

  // Check if room with this code already exists
  const existingRoom = findRoomByCode(roomCode)
  if (existingRoom) {
    if (existingRoom.members.size >= maxMembers && !existingRoom.members.has(socketId)) {
      // If full, generate a unique one
      roomCode = generateGroupCode()
    } else {
      const existingMembers = Array.from(existingRoom.members).filter((id) => id !== socketId)
      existingRoom.members.add(socketId)
      if (!existingRoom.hostSocketId) {
        existingRoom.hostSocketId = existingMembers[0] || socketId
      }
      socketToGroupRoom.set(socketId, existingRoom.roomId)
      return {
        roomId: existingRoom.roomId,
        roomCode: existingRoom.roomCode,
        members: existingMembers,
        isNew: false,
        hostSocketId: existingRoom.hostSocketId,
      }
    }
  }

  const roomId = randomUUID()
  const room = {
    roomId,
    roomCode,
    isPublic: false,
    hostSocketId: socketId,
    members: new Set([socketId]),
    createdAt: Date.now(),
  }

  registerRoomInIndex(room)
  socketToGroupRoom.set(socketId, roomId)

  return {
    roomId,
    roomCode,
    members: [],
    isNew: true,
    hostSocketId: socketId,
  }
}

async function joinSpecificGroupRoom(codeOrId, socketId, maxMembers = MAX_GROUP_CAPACITY) {
  if (!socketId || !codeOrId) return { success: false, reason: 'Invalid room code.' }
  leaveGroupRoom(socketId)

  let room = findRoomByCode(codeOrId)

  if (room) {
    if (room.members.size >= maxMembers && !room.members.has(socketId)) {
      return { success: false, reason: `Room is full (maximum ${maxMembers} participants).` }
    }
    const existingMembers = Array.from(room.members).filter((id) => id !== socketId)
    room.members.add(socketId)
    if (!room.hostSocketId) {
      room.hostSocketId = existingMembers[0] || socketId
    }
    socketToGroupRoom.set(socketId, room.roomId)
    return {
      success: true,
      roomId: room.roomId,
      roomCode: room.roomCode,
      members: existingMembers,
      isNew: false,
      hostSocketId: room.hostSocketId,
    }
  }

  // If code doesn't exist yet, automatically initialize it with the requested code
  const roomId = randomUUID()
  const normalized = normalizeCode(codeOrId)
  const roomCode = normalized.startsWith('GRP-') ? normalized : `GRP-${normalized}`
  room = {
    roomId,
    roomCode,
    isPublic: false,
    hostSocketId: socketId,
    members: new Set([socketId]),
    createdAt: Date.now(),
  }

  registerRoomInIndex(room)
  socketToGroupRoom.set(socketId, roomId)

  return {
    success: true,
    roomId,
    roomCode,
    members: [],
    isNew: true,
    hostSocketId: socketId,
  }
}

function leaveGroupRoom(socketId) {
  if (!socketId) return null
  const roomId = socketToGroupRoom.get(socketId)
  if (!roomId) return null

  socketToGroupRoom.delete(socketId)

  let room = publicGroupRooms.get(roomId)
  if (!room) {
    for (const r of allGroupRoomsByCode.values()) {
      if (r.roomId === roomId) {
        room = r
        break
      }
    }
  }

  if (room) {
    room.members.delete(socketId)
    const remainingMembers = Array.from(room.members)
    if (room.members.size === 0) {
      publicGroupRooms.delete(roomId)
      unregisterRoomFromIndex(room)
    } else if (room.hostSocketId === socketId) {
      // Reassign host to next oldest member in the room
      room.hostSocketId = remainingMembers[0]
    }
    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      remainingMembers,
      hostSocketId: room.hostSocketId,
    }
  }

  return null
}

function getGroupRoom(roomIdOrCode) {
  if (!roomIdOrCode) return null
  const normalized = normalizeCode(roomIdOrCode)
  return allGroupRoomsByCode.get(normalized) || publicGroupRooms.get(roomIdOrCode) || null
}

module.exports = {
  WAITING_QUEUE_KEY,
  enqueueAndTryMatch,
  removeFromQueue,
  enqueueOrJoinPublicGroup,
  createCustomGroupRoom,
  joinSpecificGroupRoom,
  leaveGroupRoom,
  getGroupRoom,
}

