#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const connectDB = require('../config/mongo.config');
const qdrantService = require('../services/qdrant.service');
const ingestService = require('../services/ingest.service');
const googleService = require('../services/google.service');
const User = require('../models/mongodb/user.model');
const logger = require('../utils/logger');

const argv = yargs(hideBin(process.argv))
  .option('fileId', {
    alias: 'f',
    type: 'string',
    describe: 'Google Drive file ID'
  })
  .option('folderId', {
    alias: 'd',
    type: 'string',
    describe: 'Google Drive folder ID'
  })
  .option('since', {
    alias: 's',
    type: 'string',
    describe: 'Ingest files modified since this date (ISO format)',
    default: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  })
  .option('userId', {
    alias: 'u',
    type: 'string',
    demandOption: true,
    describe: 'User ID to associate with this ingestion'
  })
  .check((argv) => {
    if (!argv.fileId && !argv.folderId) {
      throw new Error('Either --fileId or --folderId must be provided');
    }
    return true;
  })
  .help()
  .argv;

async function main() {
  try {
    logger.info('Starting Google Drive ingestion script...');

    // Connect to databases
    await connectDB();
    await qdrantService.initialize();

    // Get user and set up Google credentials
    const user = await User.findById(argv.userId);
    if (!user || !user.oauth?.google) {
      throw new Error('User not found or Google OAuth not configured');
    }

    await googleService.setUserCredentials(
      user.oauth.google.accessToken,
      user.oauth.google.refreshToken
    );

    // Run ingestion
    const result = await ingestService.ingestGoogleDrive({
      fileId: argv.fileId,
      folderId: argv.folderId,
      since: argv.since,
      userId: argv.userId
    });

    logger.info('Ingestion completed successfully:', result);
    process.exit(0);

  } catch (error) {
    logger.error('Ingestion failed:', error);
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
