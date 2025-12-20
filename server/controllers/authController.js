const User = require('../models/User')
const { hashPassword, verifyPassword } = require('../utils/password')
const { createToken } = require('../utils/jwt')

function serializeUser(user) {
  return { id: user._id, name: user.name, email: user.email }
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' })
    }
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Enter a valid email address.' })
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with that email already exists.' })

    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await hashPassword(password) })
    return res.status(201).json({ token: createToken(user), user: serializeUser(user) })
  } catch {
    return res.status(503).json({ message: 'Account service is unavailable. Check your MongoDB connection.' })
  }
}

async function login(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const user = await User.findOne({ email })
    const validPassword = user && await verifyPassword(req.body.password || '', user.passwordHash)

    if (!validPassword) return res.status(401).json({ message: 'Email or password is incorrect.' })
    return res.json({ token: createToken(user), user: serializeUser(user) })
  } catch {
    return res.status(503).json({ message: 'Account service is unavailable. Check your MongoDB connection.' })
  }
}

async function currentUser(req, res) {
  try {
    const user = await User.findById(req.user.sub).select('name email')
    if (!user) return res.status(401).json({ message: 'Account not found.' })
    return res.json({ user: serializeUser(user) })
  } catch {
    return res.status(401).json({ message: 'Please log in again.' })
  }
}

module.exports = { register, login, currentUser }
