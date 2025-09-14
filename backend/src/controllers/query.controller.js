const queryService = require('../services/query.service');
const SearchHistory = require('../models/mongodb/searchHistory.model');
const logger = require('../utils/logger');

class QueryController {
  async search(req, res, next) {
    try {
      const startTime = Date.now();
      const { query, topK = 5, filters = {} } = req.body;
      const userId = req.user._id;

      logger.info(`Search query: "${query}" by user ${userId}`);

      const results = await queryService.search(query, {
        topK,
        filters,
        userId
      });

      const responseTime = Date.now() - startTime;

      // Save search history
      await SearchHistory.create({
        userId,
        query,
        filters,
        results: results.map((r, index) => ({
          chunkId: r.chunkId,
          score: r.score,
          rank: index + 1
        })),
        resultCount: results.length,
        responseTime
      });

      res.status(200).json({
        status: 'success',
        data: {
          query,
          results,
          responseTime,
          metadata: {
            totalResults: results.length,
            topK
          }
        }
      });
    } catch (error) {
      logger.error('Search error:', error);
      next(error);
    }
  }

  async advancedSearch(req, res, next) {
    try {
      const startTime = Date.now();
      const { 
        query, 
        topK = 5, 
        filters = {}, 
        rerank = false,
        includeMetadata = true 
      } = req.body;
      const userId = req.user._id;

      logger.info(`Advanced search query: "${query}" by user ${userId}`);

      const results = await queryService.advancedSearch(query, {
        topK,
        filters,
        rerank,
        includeMetadata,
        userId
      });

      const responseTime = Date.now() - startTime;

      // Save search history
      await SearchHistory.create({
        userId,
        query,
        filters,
        results: results.map((r, index) => ({
          chunkId: r.chunkId,
          score: r.score,
          rank: index + 1
        })),
        resultCount: results.length,
        responseTime
      });

      res.status(200).json({
        status: 'success',
        data: {
          query,
          results,
          responseTime,
          metadata: {
            totalResults: results.length,
            topK,
            reranked: rerank
          }
        }
      });
    } catch (error) {
      logger.error('Advanced search error:', error);
      next(error);
    }
  }

  async getSearchHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 20 } = req.query;

      const history = await SearchHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('query filters resultCount responseTime createdAt')
        .exec();

      const total = await SearchHistory.countDocuments({ userId });

      res.status(200).json({
        status: 'success',
        data: {
          history,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      logger.error('Get search history error:', error);
      next(error);
    }
  }

  async deleteSearchHistory(req, res, next) {
    try {
      const { historyId } = req.params;
      const userId = req.user._id;

      const result = await SearchHistory.findOneAndDelete({
        _id: historyId,
        userId
      });

      if (!result) {
        return res.status(404).json({
          status: 'error',
          message: 'Search history item not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Search history item deleted successfully'
      });
    } catch (error) {
      logger.error('Delete search history error:', error);
      next(error);
    }
  }

  async getSuggestions(req, res, next) {
    try {
      const userId = req.user._id;
      const { q } = req.query;

      const suggestions = await queryService.getSuggestions(q, userId);

      res.status(200).json({
        status: 'success',
        data: { suggestions }
      });
    } catch (error) {
      logger.error('Get suggestions error:', error);
      next(error);
    }
  }
}

module.exports = new QueryController();
