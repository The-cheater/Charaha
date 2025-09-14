const { v4: uuidv4 } = require('uuid');
const qdrantConfig = require('../config/qdrant.config');
const logger = require('../utils/logger');

class QdrantService {
  constructor() {
    this.collectionName = qdrantConfig.collectionName;
  }

  async initialize() {
    await qdrantConfig.initialize();
    this.client = qdrantConfig.getClient();
  }

  async upsertPoints(points) {
    try {
      const formattedPoints = points.map(point => ({
        id: point.id || uuidv4(),
        vector: point.vector,
        payload: point.payload
      }));

      await this.client.upsert(this.collectionName, {
        wait: true,
        points: formattedPoints
      });

      logger.info(`Upserted ${formattedPoints.length} points to Qdrant`);
      return formattedPoints.map(p => p.id);
    } catch (error) {
      logger.error('Error upserting points to Qdrant:', error);
      throw error;
    }
  }

  async search(vector, options = {}) {
    try {
      const {
        topK = 5,
        filter = {},
        withPayload = true,
        withVector = false
      } = options;

      const searchResults = await this.client.search(this.collectionName, {
        vector,
        limit: topK,
        filter,
        with_payload: withPayload,
        with_vector: withVector
      });

      return searchResults;
    } catch (error) {
      logger.error('Error searching in Qdrant:', error);
      throw error;
    }
  }

  async deletePoints(pointIds) {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: pointIds
      });
      
      logger.info(`Deleted ${pointIds.length} points from Qdrant`);
    } catch (error) {
      logger.error('Error deleting points from Qdrant:', error);
      throw error;
    }
  }

  async getCollectionInfo() {
    try {
      return await this.client.getCollection(this.collectionName);
    } catch (error) {
      logger.error('Error getting collection info:', error);
      throw error;
    }
  }
}

module.exports = new QdrantService();
