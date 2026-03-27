const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

const jwtSecret = process.env.JWT_SECRET || 'change-this-development-secret'

if (process.env.NODE_ENV === 'production' && jwtSecret === 'change-this-development-secret') {
  throw new Error('JWT_SECRET must be configured in production')
}

module.exports = {
  port: process.env.PORT || 4000,
  clientOrigins: CLIENT_ORIGINS,
  jwtSecret,
}
