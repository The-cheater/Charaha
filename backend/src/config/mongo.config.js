const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/team_memory';

    // Normalize IPv6 localhost to IPv4 to avoid ::1 issues on some Windows setups
    if (mongoUri.includes('localhost')) {
      mongoUri = mongoUri.replace('localhost', '127.0.0.1');
    }

    if (!mongoUri) {
      throw new Error('MONGO_URI is not set. Please add it to your environment variables.');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
