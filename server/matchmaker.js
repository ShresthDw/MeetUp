const { randomUUID } = require('crypto')

const WAITING_QUEUE_KEY = 'waiting_queue'

const enqueueAndPopPairLua = `
  redis.call('RPUSH', KEYS[1], ARGV[1])
  local len = redis.call('LLEN', KEYS[1])
  if len >= 2 then
    local first = redis.call('LPOP', KEYS[1])
    local second = redis.call('LPOP', KEYS[1])
    return { first, second }
  end
  return {}
`

async function enqueueAndTryMatch(redis, socketId) {
  const result = await redis.eval(enqueueAndPopPairLua, 1, WAITING_QUEUE_KEY, socketId)
  if (Array.isArray(result) && result.length === 2) {
    return {
      userA: result[0],
      userB: result[1],
      roomId: randomUUID(),
    }
  }

  return null
}

async function removeFromQueue(redis, socketId) {
  await redis.lrem(WAITING_QUEUE_KEY, 0, socketId)
}

module.exports = {
  WAITING_QUEUE_KEY,
  enqueueAndTryMatch,
  removeFromQueue,
}
