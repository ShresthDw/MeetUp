const mongoose = require('mongoose')

async function connectMongo() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.log('Mongo URI not set, skipping MongoDB connection')
    return
  }

  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
  }
}

module.exports = { connectMongo }
