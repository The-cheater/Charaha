const SearchHistory = require('../models/mongodb/searchHistory.model');
const Source = require('../models/mongodb/source.model');
const User = require('../models/mongodb/user.model');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Track search query with detailed metrics
   */
  async trackSearch(userId, query, results, responseTime, filters = {}) {
    try {
      const searchEntry = new SearchHistory({
        userId,
        query: query.toLowerCase().trim(),
        filters,
        results: results.map((result, index) => ({
          chunkId: result.payload?.chunkId,
          sourceId: result.payload?.sourceId,
          score: result.score,
          rank: index + 1
        })),
        resultCount: results.length,
        responseTime
      });

      await searchEntry.save();
      logger.debug(`📊 Tracked search query: "${query}"`);
      
      // Emit real-time analytics update via WebSocket
      this.emitAnalyticsUpdate(userId, {
        type: 'search_tracked',
        query,
        resultCount: results.length,
        responseTime
      });
      
      return searchEntry._id;
    } catch (error) {
      logger.error('❌ Failed to track search:', error);
      // Don't throw - analytics shouldn't break the search flow
    }
  }

  /**
   * Get user search analytics with real-time updates
   */
  async getUserAnalytics(userId, timeframe = 30) {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - timeframe);

      const pipeline = [
        {
          $match: {
            userId: userId,
            createdAt: { $gte: fromDate }
          }
        },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            avgResultCount: { $avg: '$resultCount' },
            uniqueQueries: { $addToSet: '$query' },
            topQueries: { $push: '$query' }
          }
        },
        {
          $project: {
            totalSearches: 1,
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            avgResultCount: { $round: ['$avgResultCount', 2] },
            uniqueQueryCount: { $size: '$uniqueQueries' }
          }
        }
      ];

      const analytics = await SearchHistory.aggregate(pipeline);
      
      // Get additional metrics
      const [popularQueries, searchFrequency, sourceStats] = await Promise.all([
        this.getPopularQueries(userId, timeframe),
        this.getSearchFrequency(userId, timeframe),
        this.getSourceAnalytics(userId)
      ]);

      const result = {
        ...analytics[0] || {
          totalSearches: 0,
          avgResponseTime: 0,
          avgResultCount: 0,
          uniqueQueryCount: 0
        },
        popularQueries,
        searchFrequency,
        sourceStats,
        timeframe
      };

      // Emit real-time analytics update
      this.emitAnalyticsUpdate(userId, {
        type: 'analytics_update',
        data: result
      });

      return result;
    } catch (error) {
      logger.error('❌ Failed to get user analytics:', error);
      throw error;
    }
  }

  /**
   * Get popular search queries
   */
  async getPopularQueries(userId, timeframe = 30) {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - timeframe);

      const pipeline = [
        {
          $match: {
            userId: userId,
            timestamp: { $gte: fromDate }
          }
        },
        {
          $group: {
            _id: '$query',
            count: { $sum: 1 },
            avgScore: { $avg: { $avg: '$results.score' } },
            lastSearched: { $max: '$createdAt' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            query: '$_id',
            count: 1,
            avgScore: { $round: ['$avgScore', 3] },
            lastSearched: 1,
            _id: 0
          }
        }
      ];

      return await SearchHistory.aggregate(pipeline);
    } catch (error) {
      logger.error('❌ Failed to get popular queries:', error);
      return [];
    }
  }

  /**
   * Get search frequency by day
   */
  async getSearchFrequency(userId, timeframe = 30) {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - timeframe);

      const pipeline = [
        {
          $match: {
            userId: userId,
            createdAt: { $gte: fromDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            searches: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' }
          }
        },
        {
          $sort: { '_id': 1 }
        },
        {
          $project: {
            date: '$_id',
            searches: 1,
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            _id: 0
          }
        }
      ];

      return await SearchHistory.aggregate(pipeline);
    } catch (error) {
      logger.error('❌ Failed to get search frequency:', error);
      return [];
    }
  }

  /**
   * Get source usage statistics
   */
  async getSourceAnalytics(userId) {
    try {
      const sources = await Source.find({ userId })
        .select('name type status stats lastSyncAt createdAt')
        .lean();
      
      const analytics = {
        totalSources: sources.length,
        activeSources: sources.filter(s => s.status === 'completed').length,
        failedSources: sources.filter(s => s.status === 'failed').length,
        sourceTypes: this.groupBySourceType(sources),
        totalChunks: sources.reduce((sum, s) => sum + (s.stats?.totalChunks || 0), 0),
        sources: sources.map(source => ({
          id: source._id,
          name: source.name,
          type: source.type,
          status: source.status,
          totalChunks: source.stats?.totalChunks || 0,
          lastSync: source.lastSyncAt,
          createdAt: source.createdAt
        }))
      };

      return analytics;
    } catch (error) {
      logger.error('❌ Failed to get source analytics:', error);
      throw error;
    }
  }

  /**
   * Generate search suggestions based on history
   */
  async generateSuggestions(userId, query, limit = 5) {
    try {
      if (!query || query.length < 2) return [];

      const pipeline = [
        {
          $match: {
            userId: userId,
            query: { $regex: query, $options: 'i' },
            resultCount: { $gt: 0 } // Only suggest queries that had results
          }
        },
        {
          $group: {
            _id: '$query',
            count: { $sum: 1 },
            avgResultCount: { $avg: '$resultCount' },
            lastSearched: { $max: '$createdAt' }
          }
        },
        {
          $sort: {
            count: -1,
            lastSearched: -1
          }
        },
        {
          $limit: limit
        },
        {
          $project: {
            query: '$_id',
            popularity: '$count',
            _id: 0
          }
        }
      ];

      const suggestions = await SearchHistory.aggregate(pipeline);
      return suggestions.map(s => s.query);
    } catch (error) {
      logger.error('❌ Failed to generate suggestions:', error);
      return [];
    }
  }

  /**
   * Track ingestion progress with WebSocket updates
   */
  async trackIngestionProgress(userId, sourceId, progress) {
    try {
      // Emit real-time progress update
      this.emitAnalyticsUpdate(userId, {
        type: 'ingestion_progress',
        sourceId,
        progress: {
          stage: progress.stage,
          processed: progress.processed,
          total: progress.total,
          percentage: Math.round((progress.processed / progress.total) * 100),
          message: progress.message
        }
      });

      logger.debug(`📊 Ingestion progress: ${sourceId} - ${progress.percentage}%`);
    } catch (error) {
      logger.error('❌ Failed to track ingestion progress:', error);
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(userId) {
    try {
      const [recentSearches, sourceCount, totalChunks] = await Promise.all([
        SearchHistory.find({ userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('query createdAt resultCount responseTime'),
        Source.countDocuments({ userId }),
        Source.aggregate([
          { $match: { userId: userId } },
          { $group: { _id: null, total: { $sum: '$stats.totalChunks' } } }
        ])
      ]);

      const dashboardData = {
        recentSearches,
        sourceCount,
        totalChunks: totalChunks[0]?.total || 0,
        timestamp: new Date()
      };

      // Emit real-time dashboard update
      this.emitAnalyticsUpdate(userId, {
        type: 'dashboard_update',
        data: dashboardData
      });

      return dashboardData;
    } catch (error) {
      logger.error('❌ Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Emit real-time analytics updates via WebSocket
   */
  emitAnalyticsUpdate(userId, data) {
    try {
      // Get WebSocket service
      const wsService = require('./webhook.service');
      wsService.emitToUser(userId, 'analytics_update', data);
    } catch (error) {
      logger.debug('WebSocket not available for analytics updates');
    }
  }

  /**
   * Helper: Group sources by type
   */
  groupBySourceType(sources) {
    return sources.reduce((acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldData(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await SearchHistory.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      logger.info(`🧹 Cleaned up ${result.deletedCount} old search history entries`);
      return result.deletedCount;
    } catch (error) {
      logger.error('❌ Failed to cleanup old analytics data:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
