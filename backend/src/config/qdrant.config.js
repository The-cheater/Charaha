const { QdrantVectorStore } = require('@qdrant/js-client-rest');
const logger = require('../utils/logger');

class QdrantConfig {
  constructor() {
    this.client = null;
    this.collectionName = process.env.QDRANT_COLLECTION_NAME || 'team_memory';
    this.vectorSize = 384; // for all-MiniLM-L6-v2
  }

  async initialize() {
    try {
      this.client = new QdrantVectorStore({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
      });

      // Create collection if it doesn't exist
      await this.ensureCollection();
      logger.info('Qdrant client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Qdrant client:', error);
      throw error;
    }
  }

  async ensureCollection() {
    try {
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        col => col.name === this.collectionName
      );

      if (!collectionExists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine'
          }
        });
        logger.info(`Created Qdrant collection: ${this.collectionName}`);
      }
    } catch (error) {
      logger.error('Error ensuring Qdrant collection:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error('Qdrant client not initialized. Call initialize() first.');
    }
    return this.client;
  }
}

module.exports = new QdrantConfig();
