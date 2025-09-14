const queryService = require('../../src/services/query.service');
const Chunk = require('../../src/models/mongodb/chunk.model');
const Source = require('../../src/models/mongodb/source.model');

// Mock services
jest.mock('../../src/services/hf.service');
jest.mock('../../src/services/qdrant.service');

describe('Query Service', () => {
  let mockUser, mockSource, mockChunk;

  beforeEach(async () => {
    // Create test data
    mockUser = { _id: 'user123' };
    
    mockSource = await Source.create({
      type: 'slack_channel',
      externalId: 'C123456',
      name: 'general',
      userId: mockUser._id,
      metadata: { workspace: 'test' }
    });

    mockChunk = await Chunk.create({
      sourceId: mockSource._id,
      externalId: 'msg123',
      qdrantPointId: 'point123',
      text: 'This is a test message about API keys',
      startChar: 0,
      endChar: 38,
      author: 'testuser',
      timestamp: new Date(),
      metadata: { channel: 'general' }
    });
  });

  describe('buildQdrantFilter', () => {
    it('should build filter with source types', async () => {
      const filters = { sources: ['slack_channel'] };
      const qdrantFilter = await queryService.buildQdrantFilter(filters, mockUser._id);

      expect(qdrantFilter.must).toContainEqual({
        key: 'sourceType',
        match: { any: ['slack_channel'] }
      });
    });

    it('should build filter with date range', async () => {
      const filters = {
        dateFrom: '2023-01-01',
        dateTo: '2023-12-31'
      };
      const qdrantFilter = await queryService.buildQdrantFilter(filters, mockUser._id);

      expect(qdrantFilter.must).toContainEqual({
        key: 'timestamp',
        range: {
          gte: '2023-01-01T00:00:00.000Z',
          lte: '2023-12-31T00:00:00.000Z'
        }
      });
    });
  });

  describe('rerankResults', () => {
    it('should rerank results based on keyword matching', async () => {
      const query = 'API keys';
      const results = [
        { text: 'This is about database connections', score: 0.8 },
        { text: 'API keys are stored in environment variables', score: 0.7 },
        { text: 'How to configure API authentication', score: 0.6 }
      ];

      const rerankedResults = await queryService.rerankResults(query, results);

      // Result with more keyword matches should be ranked higher
      expect(rerankedResults[0].text).toContain('API keys');
      expect(rerankedResults[0].reranked).toBe(true);
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions for partial query', async () => {
      const query = 'API';
      const suggestions = await queryService.getSuggestions(query, mockUser._id);

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.some(s => s.includes('API'))).toBe(true);
    });

    it('should return empty array for very short query', async () => {
      const query = 'A';
      const suggestions = await queryService.getSuggestions(query, mockUser._id);

      expect(suggestions).toEqual([]);
    });
  });
});
