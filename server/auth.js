const crypto = require('crypto')
const { promisify } = require('util')

const scrypt = promisify(crypto.scrypt)
const secret = process.env.JWT_SECRET || 'change-this-development-secret'

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false
  const derivedKey = await scrypt(password, salt, 64)
  const expected = Buffer.from(key, 'hex')
  return expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey)
}

function createToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: user._id.toString(), email: user.email, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 })).toString('base64url')
  const unsignedToken = `${header}.${payload}`
  const signature = crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64url')
  return `${unsignedToken}.${signature}`
}

function readToken(token) {
  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null
    const unsignedToken = `${header}.${payload}`
    const expected = crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64url')
    if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Math.floor(Date.now() / 1000) ? data : null
  } catch {
    return null
  }
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  const user = token && readToken(token)
  if (!user) return res.status(401).json({ message: 'Please log in to continue.' })
  req.user = user
  next()
}

module.exports = { hashPassword, verifyPassword, createToken, requireAuth }
