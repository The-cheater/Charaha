const { HfInference } = require('@huggingface/inference');
const logger = require('../utils/logger');
const config = require('../config/app.config');

class HuggingFaceService {
  constructor() {
    const apiKey = process.env.HF_API_KEY
      || process.env.HUGGINGFACE_API_KEY
      || process.env.HUGGING_FACE_API_KEY;
    this.hf = new HfInference(apiKey);
    this.model = config.embedding.model;
  }

  async generateEmbedding(text) {
    try {
      const response = await this.hf.featureExtraction({
        model: this.model,
        inputs: text
      });

      return Array.isArray(response) ? response : Array.from(response);
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async generateEmbeddings(texts) {
    try {
      const embeddings = await Promise.all(
        texts.map(text => this.generateEmbedding(text))
      );
      return embeddings;
    } catch (error) {
      logger.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const testEmbedding = await this.generateEmbedding('test');
      return testEmbedding.length === config.embedding.vectorSize;
    } catch (error) {
      logger.error('HuggingFace health check failed:', error);
      return false;
    }
  }
}

module.exports = new HuggingFaceService();
