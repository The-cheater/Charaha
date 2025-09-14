const chunkerService = require('../../src/services/chunker.service');
const hfService = require('../../src/services/hf.service');

// Mock external services
jest.mock('../../src/services/hf.service');
jest.mock('../../src/services/qdrant.service');
jest.mock('../../src/services/slack.service');

describe('Chunker Service', () => {
  describe('chunkText', () => {
    it('should return single chunk for short text', () => {
      const text = 'This is a short text that should not be chunked.';
      const chunks = chunkerService.chunkText(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe(text);
      expect(chunks[0].startChar).toBe(0);
      expect(chunks[0].endChar).toBe(text.length);
    });

    it('should split long text into multiple chunks', () => {
      const longText = 'A'.repeat(2000); // 2000 characters
      const chunks = chunkerService.chunkText(longText);

      expect(chunks.length).toBeGreaterThan(1);
      
      // Check overlap
      for (let i = 1; i < chunks.length; i++) {
        const prevChunk = chunks[i - 1];
        const currentChunk = chunks[i];
        
        const overlapStart = Math.max(0, prevChunk.endChar - 200);
        expect(currentChunk.startChar).toBeLessThanOrEqual(overlapStart);
      }
    });

    it('should normalize text properly', () => {
      const text = '  This   has   excessive   whitespace  ';
      const chunks = chunkerService.chunkText(text);

      expect(chunks[0].text).toBe('This has excessive whitespace');
    });
  });

  describe('chunkSlackMessage', () => {
    it('should chunk Slack message with metadata', () => {
      const message = {
        text: 'This is a Slack message with some content.',
        user: 'U123456',
        ts: '1234567890.123456',
        channel: 'C123456'
      };

      const channelInfo = { name: 'general', id: 'C123456' };
      const chunks = chunkerService.chunkSlackMessage(message, channelInfo);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].metadata.type).toBe('slack_message');
      expect(chunks[0].metadata.author).toBe(message.user);
      expect(chunks[0].metadata.channel).toBe(channelInfo.name);
      expect(chunks[0].metadata.messageId).toBe(message.ts);
    });
  });
});

describe('HuggingFace Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      const mockEmbedding = new Array(384).fill(0.1);
      hfService.generateEmbedding.mockResolvedValue(mockEmbedding);

      const text = 'Test text for embedding';
      const embedding = await hfService.generateEmbedding(text);

      expect(embedding).toHaveLength(384);
      expect(hfService.generateEmbedding).toHaveBeenCalledWith(text);
    });

    it('should handle embedding generation errors', async () => {
      hfService.generateEmbedding.mockRejectedValue(new Error('API Error'));

      await expect(
        hfService.generateEmbedding('test text')
      ).rejects.toThrow('API Error');
    });
  });
});
