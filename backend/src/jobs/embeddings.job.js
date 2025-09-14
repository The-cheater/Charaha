const hfService = require('../services/hf.service');
const qdrantService = require('../services/qdrant.service');
const Chunk = require('../models/mongodb/chunk.model');
const logger = require('../utils/logger');

class EmbeddingsJob {
  constructor() {
    this.isRunning = false;
    this.batchSize = 50;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Embeddings job is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting embeddings background job');

    try {
      await this.processUnembeddedChunks();
    } catch (error) {
      logger.error('Embeddings job error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async processUnembeddedChunks() {
    try {
      // Find chunks that don't have embeddings yet (no qdrantPointId)
      const unembeddedChunks = await Chunk.find({
        qdrantPointId: { $exists: false }
      }).limit(this.batchSize);

      if (unembeddedChunks.length === 0) {
        logger.info('No unembedded chunks found');
        return;
      }

      logger.info(`Processing ${unembeddedChunks.length} unembedded chunks`);

      const batchPromises = [];
      
      for (let i = 0; i < unembeddedChunks.length; i += 10) {
        const batch = unembeddedChunks.slice(i, i + 10);
        batchPromises.push(this.processBatch(batch));
      }

      await Promise.all(batchPromises);
      logger.info(`Completed processing ${unembeddedChunks.length} chunks`);

    } catch (error) {
      logger.error('Error processing unembedded chunks:', error);
      throw error;
    }
  }

  async processBatch(chunks) {
    try {
      // Generate embeddings for the batch
      const texts = chunks.map(chunk => chunk.text);
      const embeddings = await hfService.generateEmbeddings(texts);

      // Create vector points
      const vectorPoints = chunks.map((chunk, index) => ({
        id: chunk._id.toString(),
        vector: embeddings[index],
        payload: {
          chunkId: chunk._id.toString(),
          sourceType: chunk.sourceId ? 'unknown' : 'unknown', // You'd need to populate sourceId
          author: chunk.author,
          timestamp: chunk.timestamp.toISOString()
        }
      }));

      // Upsert to Qdrant
      const pointIds = await qdrantService.upsertPoints(vectorPoints);

      // Update chunks with Qdrant point IDs
      await Promise.all(chunks.map((chunk, index) => {
        chunk.qdrantPointId = pointIds[index];
        return chunk.save();
      }));

      logger.info(`Processed batch of ${chunks.length} chunks`);
    } catch (error) {
      logger.error('Error processing batch:', error);
      throw error;
    }
  }

  async reprocessAllEmbeddings() {
    logger.info('Starting reprocessing of all embeddings');
    
    try {
      // Clear all qdrantPointId fields to trigger reprocessing
      await Chunk.updateMany({}, { $unset: { qdrantPointId: 1 } });
      
      // Process all chunks
      await this.processUnembeddedChunks();
      
      logger.info('Completed reprocessing all embeddings');
    } catch (error) {
      logger.error('Error reprocessing embeddings:', error);
      throw error;
    }
  }

  stop() {
    this.isRunning = false;
    logger.info('Stopping embeddings job');
  }
}

module.exports = new EmbeddingsJob();
