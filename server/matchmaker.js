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

module.exports = {
  WAITING_QUEUE_KEY,
  enqueueAndTryMatch,
  removeFromQueue,
}

