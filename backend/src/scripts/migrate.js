#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/mongo.config');
const logger = require('../utils/logger');

// Import models to ensure they're registered
require('../models/mongodb/user.model');
require('../models/mongodb/source.model');
require('../models/mongodb/chunk.model');
require('../models/mongodb/searchHistory.model');

async function createIndexes() {
  try {
    logger.info('Creating database indexes...');

    const db = mongoose.connection.db;

    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });

    // Sources indexes
    await db.collection('sources').createIndex({ userId: 1, ingestedAt: -1 });
    await db.collection('sources').createIndex({ type: 1, externalId: 1, userId: 1 }, { unique: true });

    // Chunks indexes
    await db.collection('chunks').createIndex({ sourceId: 1, timestamp: -1 });
    await db.collection('chunks').createIndex({ qdrantPointId: 1 }, { unique: true });
    await db.collection('chunks').createIndex({ author: 1, timestamp: -1 });
    await db.collection('chunks').createIndex({ 'metadata.channel': 1, timestamp: -1 });

    // Search history indexes
    await db.collection('searchhistories').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('searchhistories').createIndex({ query: 'text' });
    await db.collection('searchhistories').createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
}

async function main() {
  try {
    logger.info('Starting database migration...');

    await connectDB();
    await createIndexes();

    logger.info('Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = main;
