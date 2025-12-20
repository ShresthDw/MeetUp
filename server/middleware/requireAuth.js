const { readToken } = require('../utils/jwt')

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  const user = token && readToken(token)

  if (!user) {
    return res.status(401).json({ message: 'Please log in to continue.' })
  }

  req.user = user
  next()
}

module.exports = { requireAuth }
