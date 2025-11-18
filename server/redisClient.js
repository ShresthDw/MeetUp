const Redis = require('ioredis')

const redisUrl =
  process.env.REDIS_URL || process.env.REDIS_URI || 'redis://127.0.0.1:6379'

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
})

redis.on('connect', () => {
  console.log('Redis connected')
})

redis.on('error', (err) => {
  console.error('Redis error:', err.message)
})

module.exports = redis
