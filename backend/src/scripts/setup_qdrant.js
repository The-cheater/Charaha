#!/usr/bin/env node

require('dotenv').config();
const qdrantService = require('../services/qdrant.service');
const logger = require('../utils/logger');

async function main() {
  try {
    logger.info('Setting up Qdrant collection...');

    await qdrantService.initialize();
    
    const collectionInfo = await qdrantService.getCollectionInfo();
    logger.info('Collection setup completed:', collectionInfo);

    logger.info('Qdrant setup completed successfully!');
    process.exit(0);

  } catch (error) {
    logger.error('Qdrant setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
