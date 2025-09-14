const hfService = require('./hf.service');
const qdrantService = require('./qdrant.service');
const Chunk = require('../models/mongodb/chunk.model');
const Source = require('../models/mongodb/source.model');
const SearchHistory = require('../models/mongodb/searchHistory.model');
const logger = require('../utils/logger');

class QueryService {
  async search(query, options = {}) {
    try {
      const { topK = 5, filters = {}, userId } = options;

      // Generate query embedding
      const queryEmbedding = await hfService.generateEmbedding(query);

      // Build Qdrant filter
      const qdrantFilter = await this.buildQdrantFilter(filters, userId);

      // Search in Qdrant
      const searchResults = await qdrantService.search(queryEmbedding, {
        topK,
        filter: qdrantFilter,
        withPayload: true
      });

      // Enrich results with MongoDB data
      const enrichedResults = await this.enrichSearchResults(searchResults);

      return enrichedResults;
    } catch (error) {
      logger.error('Search error:', error);
      throw error;
    }
  }

  async advancedSearch(query, options = {}) {
    try {
      const { 
        topK = 5, 
        filters = {}, 
        rerank = false, 
        includeMetadata = true,
        userId 
      } = options;

      // Get initial results
      let results = await this.search(query, { topK: topK * 2, filters, userId });

      // Re-rank if requested
      if (rerank) {
        results = await this.rerankResults(query, results);
        results = results.slice(0, topK);
      }

      // Include additional metadata if requested
      if (includeMetadata) {
        results = await this.addMetadata(results);
      }

      return results;
    } catch (error) {
      logger.error('Advanced search error:', error);
      throw error;
    }
  }

  async buildQdrantFilter(filters, userId) {
    const qdrantFilter = { must: [] };

    // User-based filtering - only show results from user's sources
    if (userId) {
      const userSources = await Source.find({ userId }).select('_id');
      const sourceIds = userSources.map(s => s._id.toString());
      
      // This would need to be implemented based on how you store source references in Qdrant payload
      // For now, we'll handle this at the MongoDB level
    }

    // Source type filtering
    if (filters.sources && filters.sources.length > 0) {
      qdrantFilter.must.push({
        key: 'sourceType',
        match: { any: filters.sources }
      });
    }

    // Date filtering
    if (filters.dateFrom || filters.dateTo) {
      const dateFilter = {};
      if (filters.dateFrom) {
        dateFilter.gte = new Date(filters.dateFrom).toISOString();
      }
      if (filters.dateTo) {
        dateFilter.lte = new Date(filters.dateTo).toISOString();
      }
      
      qdrantFilter.must.push({
        key: 'timestamp',
        range: dateFilter
      });
    }

    // Author filtering
    if (filters.authors && filters.authors.length > 0) {
      qdrantFilter.must.push({
        key: 'author',
        match: { any: filters.authors }
      });
    }

    return qdrantFilter.must.length > 0 ? qdrantFilter : undefined;
  }

  async enrichSearchResults(qdrantResults) {
    const enrichedResults = [];

    for (const result of qdrantResults) {
      try {
        const chunkId = result.payload.chunkId;
        const chunk = await Chunk.findById(chunkId)
          .populate('sourceId')
          .exec();

        if (chunk) {
          enrichedResults.push({
            score: result.score,
            text: chunk.text,
            chunkId: chunk._id,
            source: chunk.sourceId.type,
            sourceUrl: result.payload.sourceUrl,
            author: chunk.author,
            timestamp: chunk.timestamp,
            metadata: {
              ...chunk.metadata,
              sourceName: chunk.sourceId.name,
              startChar: chunk.startChar,
              endChar: chunk.endChar
            }
          });
        }
      } catch (error) {
        logger.error('Error enriching search result:', error);
        // Continue with other results even if one fails
      }
    }

    return enrichedResults;
  }

  async rerankResults(query, results) {
    // Simple reranking based on keyword matching
    // In production, you might want to use a cross-encoder model
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return results.map(result => {
      const text = result.text.toLowerCase();
      let keywordScore = 0;
      
      queryTerms.forEach(term => {
        const matches = (text.match(new RegExp(term, 'g')) || []).length;
        keywordScore += matches * 0.1; // Boost for exact keyword matches
      });

      return {
        ...result,
        score: result.score + keywordScore,
        reranked: true
      };
    }).sort((a, b) => b.score - a.score);
  }

  async addMetadata(results) {
    // Add additional metadata like related chunks, context, etc.
    for (const result of results) {
      try {
        // Find related chunks from the same source
        const relatedChunks = await Chunk.find({
          sourceId: result.sourceId,
          _id: { $ne: result.chunkId },
          timestamp: {
            $gte: new Date(result.timestamp.getTime() - 5 * 60 * 1000), // 5 minutes before
            $lte: new Date(result.timestamp.getTime() + 5 * 60 * 1000)  // 5 minutes after
          }
        }).limit(3).select('text timestamp');

        result.metadata.relatedChunks = relatedChunks;
      } catch (error) {
        logger.error('Error adding metadata to result:', error);
      }
    }

    return results;
  }

  async getSuggestions(query, userId) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      // Get recent search history for suggestions
      const recentSearches = await SearchHistory.find({
        userId,
        query: new RegExp(query, 'i')
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('query')
      .exec();

      const suggestions = recentSearches.map(search => search.query);

      // Add some common query patterns if we have few suggestions
      if (suggestions.length < 3) {
        const commonPatterns = [
          `How to ${query}`,
          `What is ${query}`,
          `${query} documentation`,
          `${query} examples`
        ];
        
        suggestions.push(...commonPatterns.slice(0, 3 - suggestions.length));
      }

      return [...new Set(suggestions)]; // Remove duplicates
    } catch (error) {
      logger.error('Get suggestions error:', error);
      return [];
    }
  }
}

module.exports = new QueryService();
