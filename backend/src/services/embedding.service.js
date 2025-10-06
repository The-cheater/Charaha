const fetch = require('node-fetch');
const logger = require('../utils/logger');

class EmbeddingService {
  constructor() {
    // Using the BAAI/bge-small-en-v1.5 model as configured in .env
    this.apiUrl = process.env.HUGGING_FACE_API_URL || 'https://api-inference.huggingface.co/models/BAAI/bge-small-en-v1.5';
    this.apiKey = process.env.HUGGING_FACE_API_KEY || process.env.HF_API_KEY;
    this.modelName = process.env.HF_MODEL || 'BAAI/bge-small-en-v1.5';
    this.embeddingDimension = parseInt(process.env.VECTOR_DIMENSION) || 384;
    
    this.embeddingCache = new Map();
    this.maxCacheSize = 1000;
    this.requestsPerMinute = 30;
    this.lastRequestTime = 0;
  }

  async generateEmbedding(text) {
    try {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Invalid text input for embedding');
      }

      const cleanText = this.preprocessText(text);
      
      const cacheKey = this.getCacheKey(cleanText);
      if (this.embeddingCache.has(cacheKey)) {
        logger.debug('📦 Retrieved embedding from cache');
        return this.embeddingCache.get(cacheKey);
      }

      const embedding = await this.requestEmbedding(cleanText);
      this.cacheEmbedding(cacheKey, embedding);
      
      logger.debug(`🧠 Generated embedding for text (${cleanText.length} chars)`);
      return embedding;
    } catch (error) {
      logger.error('❌ Failed to generate embedding:', error);
      throw error;
    }
  }

  // ✅ FIXED: Using the correct endpoint for sentence embeddings
  async requestEmbedding(text) {
    try {
      await this.waitForRateLimit();
      
      // Prepare the request for BAAI model
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true,
            use_cache: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`HF API Error ${response.status}:`, errorText);
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      logger.debug('HF API Response received');
      
      // Handle the response from BAAI model
      let embedding = result;
      
      // If the response is an array, take the first element
      if (Array.isArray(embedding)) {
        // If it's an array of arrays, take the first one
        if (embedding.length > 0 && Array.isArray(embedding[0])) {
          embedding = embedding[0];
        }
      }
      
      // Ensure we have a valid embedding
      if (!Array.isArray(embedding) || embedding.length !== this.embeddingDimension) {
        logger.error('Unexpected embedding format:', {
          expectedLength: this.embeddingDimension,
          actualLength: Array.isArray(embedding) ? embedding.length : 'not an array',
          type: typeof embedding,
          firstFew: Array.isArray(embedding) ? embedding.slice(0, 5) : embedding
        });
        throw new Error(`Invalid embedding format. Expected array of length ${this.embeddingDimension}, got ${Array.isArray(embedding) ? embedding.length : 'non-array'}`);
      }
      
      // Validate embedding
      if (!Array.isArray(embedding)) {
        logger.error('Embedding is not an array:', typeof embedding, embedding);
        throw new Error(`Embedding is not an array, got: ${typeof embedding}`);
      }
      
      if (embedding.length !== this.embeddingDimension) {
        logger.error(`Wrong embedding dimension: expected ${this.embeddingDimension}, got ${embedding.length}`);
        throw new Error(`Invalid embedding format. Expected ${this.embeddingDimension} dimensions, got ${embedding.length}`);
      }

      return embedding;
    } catch (error) {
      logger.error('❌ Hugging Face API request failed:', error);
      
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        await this.delay(10000);
        return this.requestEmbedding(text);
      }
      
      throw error;
    }
  }

  preprocessText(text) {
    return text.trim().replace(/\s+/g, ' ').slice(0, 512);
  }

  getCacheKey(text) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(text).digest('hex');
  }

  cacheEmbedding(key, embedding) {
    if (this.embeddingCache.size >= this.maxCacheSize) {
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }
    this.embeddingCache.set(key, embedding);
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = (60 * 1000) / this.requestsPerMinute;
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await this.delay(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async healthCheck() {
    try {
      const testEmbedding = await this.generateEmbedding('test');
      return {
        status: 'healthy',
        model: this.modelName,
        dimension: this.embeddingDimension,
        testEmbeddingLength: testEmbedding.length
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  calculateSimilarity(embedding1, embedding2) {
    try {
      if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
        throw new Error('Invalid embeddings for similarity calculation');
      }

      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
      }

      const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      logger.error('❌ Failed to calculate similarity:', error);
      return 0;
    }
  }

  getStats() {
    return {
      cacheSize: this.embeddingCache.size,
      maxCacheSize: this.maxCacheSize,
      modelName: this.modelName,
      embeddingDimension: this.embeddingDimension,
      lastRequestTime: new Date(this.lastRequestTime).toISOString()
    };
  }

  clearCache() {
    this.embeddingCache.clear();
    logger.info('🧹 Cleared embedding cache');
  }
}

module.exports = new EmbeddingService();
