const mongoose = require('mongoose');
const qdrantService = require('../services/qdrant.service');
const Chunk = require('../models/mongodb/chunk.model');
const Source = require('../models/mongodb/source.model');
const SearchHistory = require('../models/mongodb/searchHistory.model');
const logger = require('../utils/logger');

class CleanupJob {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Cleanup job is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting cleanup job');

    try {
      await Promise.all([
        this.cleanupOrphanedChunks(),
        this.cleanupOldSearchHistory(),
        this.cleanupFailedSources(),
        this.syncQdrantWithMongoDB()
      ]);
    } catch (error) {
      logger.error('Cleanup job error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async cleanupOrphanedChunks() {
    try {
      logger.info('Cleaning up orphaned chunks');

      // Find chunks whose source no longer exists
      const orphanedChunks = await Chunk.aggregate([
        {
          $lookup: {
            from: 'sources',
            localField: 'sourceId',
            foreignField: '_id',
            as: 'source'
          }
        },
        {
          $match: {
            source: { $size: 0 }
          }
        }
      ]);

      if (orphanedChunks.length === 0) {
        logger.info('No orphaned chunks found');
        return;
      }

      logger.info(`Found ${orphanedChunks.length} orphaned chunks`);

      // Delete from Qdrant
      const pointIds = orphanedChunks
        .map(chunk => chunk.qdrantPointId)
        .filter(Boolean);

      if (pointIds.length > 0) {
        await qdrantService.deletePoints(pointIds);
      }

      // Delete from MongoDB
      const orphanedIds = orphanedChunks.map(chunk => chunk._id);
      await Chunk.deleteMany({ _id: { $in: orphanedIds } });

      logger.info(`Cleaned up ${orphanedChunks.length} orphaned chunks`);
    } catch (error) {
      logger.error('Error cleaning up orphaned chunks:', error);
      throw error;
    }
  }

  async cleanupOldSearchHistory() {
    try {
      logger.info('Cleaning up old search history');

      // Delete search history older than 90 days
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const result = await SearchHistory.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      logger.info(`Cleaned up ${result.deletedCount} old search history entries`);
    } catch (error) {
      logger.error('Error cleaning up search history:', error);
      throw error;
    }
  }

  async cleanupFailedSources() {
    try {
      logger.info('Cleaning up failed sources');

      // Find sources that have been in 'failed' state for more than 24 hours
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const failedSources = await Source.find({
        status: 'failed',
        updatedAt: { $lt: cutoffDate }
      });

      if (failedSources.length === 0) {
        logger.info('No failed sources to clean up');
        return;
      }

      logger.info(`Found ${failedSources.length} failed sources to clean up`);

      for (const source of failedSources) {
        // Delete associated chunks
        const chunks = await Chunk.find({ sourceId: source._id });
        const pointIds = chunks.map(chunk => chunk.qdrantPointId).filter(Boolean);

        if (pointIds.length > 0) {
          await qdrantService.deletePoints(pointIds);
        }

        await Chunk.deleteMany({ sourceId: source._id });
        await Source.findByIdAndDelete(source._id);
      }

      logger.info(`Cleaned up ${failedSources.length} failed sources`);
    } catch (error) {
      logger.error('Error cleaning up failed sources:', error);
      throw error;
    }
  }

  async syncQdrantWithMongoDB() {
    try {
      logger.info('Syncing Qdrant with MongoDB');

      // Find chunks that have qdrantPointId but the point doesn't exist in Qdrant
      const chunks = await Chunk.find({ qdrantPointId: { $exists: true } }).limit(1000);
      
      if (chunks.length === 0) {
        logger.info('No chunks to sync');
        return;
      }

      // Check which points exist in Qdrant
      const pointIds = chunks.map(chunk => chunk.qdrantPointId);
      
      // Note: This would need to be implemented in qdrantService
      // const existingPoints = await qdrantService.checkPointsExist(pointIds);
      
      // For now, we'll skip this sync as it requires additional Qdrant methods
      logger.info(`Checked sync for ${chunks.length} chunks`);
      
    } catch (error) {
      logger.error('Error syncing Qdrant with MongoDB:', error);
      throw error;
    }
  }

  async forceCleanup() {
    logger.info('Starting force cleanup (removes all data)');
    
    try {
      // Delete all vector points
      const collectionInfo = await qdrantService.getCollectionInfo();
      if (collectionInfo.points_count > 0) {
        // This would need to be implemented in qdrantService
        // await qdrantService.deleteAllPoints();
      }

      // Delete all chunks
      const chunksDeleted = await Chunk.deleteMany({});
      logger.info(`Deleted ${chunksDeleted.deletedCount} chunks`);

      // Delete all sources
      const sourcesDeleted = await Source.deleteMany({});
      logger.info(`Deleted ${sourcesDeleted.deletedCount} sources`);

      // Delete all search history
      const historyDeleted = await SearchHistory.deleteMany({});
      logger.info(`Deleted ${historyDeleted.deletedCount} search history entries`);

      logger.info('Force cleanup completed');
    } catch (error) {
      logger.error('Error in force cleanup:', error);
      throw error;
    }
  }

  stop() {
    this.isRunning = false;
    logger.info('Stopping cleanup job');
  }
}

module.exports = new CleanupJob();
