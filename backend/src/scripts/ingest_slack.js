#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const connectDB = require('../config/mongo.config');
const qdrantService = require('../services/qdrant.service');
const ingestService = require('../services/ingest.service');
const logger = require('../utils/logger');

const argv = yargs(hideBin(process.argv))
  .option('channel', {
    alias: 'c',
    type: 'string',
    demandOption: true,
    describe: 'Slack channel ID (e.g., C03ABCDEF)'
  })
  .option('since', {
    alias: 's',
    type: 'string',
    describe: 'Ingest messages since this date (ISO format)',
    default: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  })
  .option('workspace', {
    alias: 'w',
    type: 'string',
    describe: 'Slack workspace name'
  })
  .option('userId', {
    alias: 'u',
    type: 'string',
    demandOption: true,
    describe: 'User ID to associate with this ingestion'
  })
  .help()
  .argv;

async function main() {
  try {
    logger.info('Starting Slack ingestion script...');

    // Connect to databases
    await connectDB();
    await qdrantService.initialize();

    // Run ingestion
    const result = await ingestService.ingestSlackChannel({
      channel: argv.channel,
      since: argv.since,
      workspace: argv.workspace,
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
