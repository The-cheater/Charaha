const vectorService = require('../services/vector.service');
const logger = require('../utils/logger');

class QueryController {
  constructor() {
    this.vectorService = vectorService;
  }

  /**
   * Combined search across all sources (Slack + Google Drive)
   */
  search = async (req, res) => {
    try {
      let { query, topK = 10, source = 'all', minScore = 0.7, filters = {} } = req.body;

      if (!query || query.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Query is required'
        });
      }

      // ✅ FIX: Handle source validation more flexibly
      if (source && !['slack', 'google-drive', 'all'].includes(source)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid source. Must be slack, google-drive, or all'
        });
      }

      // ✅ FIX: Set up filters properly for all sources
      const searchFilters = { ...filters };
      
      // If no specific source is provided or source is 'all', search all sources
      if (!source || source === 'all') {
        // Don't restrict by source - search everything
        delete searchFilters.source;
      } else {
        // Search specific source
        searchFilters.source = source;
      }

      logger.info(`Search query: "${query}" with source: ${source || 'all'}`);

      // Perform vector search with source filtering
      const results = await this.vectorService.searchSimilar(query, topK, {
        minScore,
        ...searchFilters
      });

      // Group results by source
      const groupedResults = results.reduce((acc, result) => {
        const src = result.metadata?.source || 'unknown';
        if (!acc[src]) acc[src] = [];
        acc[src].push(result);
        return acc;
      }, {});

      // Calculate source counts
      const sourceCounts = Object.keys(groupedResults).reduce((acc, src) => {
        acc[src] = groupedResults[src].length;
        return acc;
      }, {});

      res.json({
        status: 'success',
        data: {
          query,
          totalResults: results.length,
          sources: sourceCounts,
          results: results,
          groupedResults,
          searchParams: {
            topK,
            source,
            minScore,
            filters: searchFilters
          }
        }
      });

    } catch (error) {
      logger.error('Search failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Search failed'
      });
    }
  };

  /**
   * Source-specific search
   */
  searchBySource = async (req, res) => {
    try {
      const { source } = req.params;
      const { query, topK = 10, minScore = 0.7 } = req.body;

      if (!['slack', 'google-drive'].includes(source)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid source. Must be slack or google-drive'
        });
      }

      if (!query || query.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Query is required'
        });
      }

      const results = await this.vectorService.searchSimilar(query, topK, {
        source,
        minScore
      });

      res.json({
        status: 'success',
        data: {
          query,
          source,
          totalResults: results.length,
          results
        }
      });

    } catch (error) {
      logger.error(`Search by source ${source} failed:`, error);
      res.status(500).json({
        status: 'error',
        message: error.message || `Search by source failed`
      });
    }
  };

  /**
   * Get search statistics
   */
  getStats = async (req, res) => {
    try {
      const stats = await this.vectorService.getCollectionStats();
      
      res.json({
        status: 'success',
        data: stats
      });

    } catch (error) {
      logger.error('Get stats failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to get stats'
      });
    }
  };
}

module.exports = new QueryController();
