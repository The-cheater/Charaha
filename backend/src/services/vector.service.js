const { QdrantClient } = require('@qdrant/js-client-rest');
const { HfInference } = require('@huggingface/inference');
const logger = require('../utils/logger');

class VectorService {
  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
    
    const hfApiKey = process.env.HF_API_KEY
      || process.env.HUGGINGFACE_API_KEY
      || process.env.HUGGING_FACE_API_KEY;
    this.hf = new HfInference(hfApiKey);
    this.collectionName = process.env.QDRANT_COLLECTION_NAME || 'team_knowledge';
    this.embeddingModel = process.env.EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
  }

  async initializeCollection() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections?.some(c => c.name === this.collectionName);
      
      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 384, // all-MiniLM-L6-v2 dimension
            distance: 'Cosine',
          },
        });
        logger.info(`Created collection: ${this.collectionName}`);
      } else {
        logger.info(`Collection already exists: ${this.collectionName}`);
      }
    } catch (error) {
      logger.error('Failed to initialize collection:', error);
      throw error;
    }
  }

  async addVectors(points) {
    try {
      if (!Array.isArray(points) || points.length === 0) return;
      await this.client.upsert(this.collectionName, {
        wait: true,
        points
      });
      logger.info(`Upserted ${points.length} vectors into ${this.collectionName}`);
    } catch (error) {
      logger.error('Failed to add vectors:', error);
      throw error;
    }
  }

  async deleteVectors(selector) {
    try {
      // selector can be { ids: [...] } or { filter: {...} }
      await this.client.delete(this.collectionName, selector);
      logger.info('Deleted vectors with selector:', selector);
    } catch (error) {
      logger.error('Failed to delete vectors:', error);
      throw error;
    }
  }

  async getCollectionInfo() {
    try {
      return await this.client.getCollection(this.collectionName);
    } catch (error) {
      logger.error('Failed to get collection info:', error);
      throw error;
    }
  }

  async generateEmbedding(text) {
    try {
      if (!text || text.trim() === '') {
        throw new Error('Text cannot be empty');
      }

      const response = await this.hf.featureExtraction({
        model: this.embeddingModel,
        inputs: text,
      });

      return Array.isArray(response[0]) ? response[0] : response;
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async storeVector(id, text, metadata = {}) {
    try {
      const embedding = await this.generateEmbedding(text);
      
      const point = {
        id: this.generatePointId(id),
        vector: embedding,
        payload: {
          text: text.substring(0, 10000), // Limit text size in payload
          source: metadata.source || 'unknown',
          timestamp: metadata.timestamp || new Date().toISOString(),
          ...metadata
        },
      };

      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [point],
      });

      logger.info(`Stored vector for ${metadata.source || 'unknown'} document: ${id}`);
      return point.id;
    } catch (error) {
      logger.error(`Failed to store vector for ${id}:`, error);
      throw error;
    }
  }

  async searchSimilar(query, topK = 10, filters = {}) {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      const searchParams = {
        vector: queryEmbedding,
        limit: topK,
        with_payload: true,
        with_vector: false,
      };

      // Add source filter if specified
      if (filters.source) {
        searchParams.filter = {
          must: [{
            key: 'source',
            match: { value: filters.source }
          }]
        };
      }

      // Add score threshold if specified
      if (filters.minScore) {
        searchParams.score_threshold = filters.minScore;
      }

      const results = await this.client.search(this.collectionName, searchParams);
      
      return results.map(result => ({
        id: result.id,
        score: result.score,
        text: result.payload?.text || '',
        metadata: {
          source: result.payload?.source,
          timestamp: result.payload?.timestamp,
          fileName: result.payload?.fileName,
          channelId: result.payload?.channelId,
          userId: result.payload?.userId,
          fileId: result.payload?.fileId,
          mimeType: result.payload?.mimeType,
          webViewLink: result.payload?.webViewLink,
          ...result.payload
        }
      }));
    } catch (error) {
      logger.error('Failed to search vectors:', error);
      throw error;
    }
  }

  async deleteVector(id) {
    try {
      await this.client.delete(this.collectionName, {
        ids: [this.generatePointId(id)],
      });
      logger.info(`Deleted vector: ${id}`);
    } catch (error) {
      logger.error(`Failed to delete vector ${id}:`, error);
      throw error;
    }
  }

  async getCollectionStats() {
    try {
      const info = await this.client.getCollection(this.collectionName);
      const stats = {
        totalVectors: info.points_count || 0,
        vectorDimension: info.config?.params?.vectors?.size || 0,
        distance: info.config?.params?.vectors?.distance || 'unknown'
      };

      // Get source breakdown using scroll
      const sourceStats = {};
      let offset = null;
      
      do {
        const scrollResult = await this.client.scroll(this.collectionName, {
          limit: 100,
          offset,
          with_payload: ['source'],
          with_vector: false
        });

        scrollResult.points?.forEach(point => {
          const source = point.payload?.source || 'unknown';
          sourceStats[source] = (sourceStats[source] || 0) + 1;
        });

        offset = scrollResult.next_page_offset;
      } while (offset);

      return {
        ...stats,
        sourceBreakdown: sourceStats,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get collection stats:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const collections = await this.client.getCollections();
      const hasCollection = collections.collections?.some(c => c.name === this.collectionName);
      
      return {
        status: 'healthy',
        collectionExists: hasCollection,
        collections: collections.collections?.length || 0
      };
    } catch (error) {
      logger.error('Vector service health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  generatePointId(originalId) {
    // Ensure point ID is valid for Qdrant (should be number or UUID string)
    if (typeof originalId === 'string') {
      // Convert string to consistent number
      return Math.abs(originalId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0));
    }
    return originalId;
  }
}

module.exports = new VectorService();
