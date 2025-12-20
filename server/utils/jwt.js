const crypto = require('crypto')
const { jwtSecret } = require('../config/env')

function createToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    sub: user._id.toString(),
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })).toString('base64url')
  const unsignedToken = `${header}.${payload}`
  const signature = crypto.createHmac('sha256', jwtSecret).update(unsignedToken).digest('base64url')

  return `${unsignedToken}.${signature}`
}

function readToken(token) {
  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null

    const unsignedToken = `${header}.${payload}`
    const expectedSignature = crypto.createHmac('sha256', jwtSecret)
      .update(unsignedToken)
      .digest('base64url')

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Math.floor(Date.now() / 1000) ? data : null
  } catch {
    return null
  }
}

module.exports = { createToken, readToken }
