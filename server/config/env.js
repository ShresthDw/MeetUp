const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

module.exports = {
  port: process.env.PORT || 4000,
  clientOrigins: CLIENT_ORIGINS,
  jwtSecret: process.env.JWT_SECRET || 'change-this-development-secret',
}
