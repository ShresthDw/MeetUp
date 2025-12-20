const crypto = require('crypto')
const { promisify } = require('util')

const scrypt = promisify(crypto.scrypt)

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false

  const derivedKey = await scrypt(password, salt, 64)
  const expectedKey = Buffer.from(key, 'hex')
  return expectedKey.length === derivedKey.length
    && crypto.timingSafeEqual(expectedKey, derivedKey)
}

module.exports = { hashPassword, verifyPassword }
