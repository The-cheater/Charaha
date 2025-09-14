const mongoose = require('mongoose');
const User = require('../../src/models/mongodb/user.model');
const Source = require('../../src/models/mongodb/source.model');
const Chunk = require('../../src/models/mongodb/chunk.model');

describe('Database Integration Tests', () => {
  describe('User Model', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user']
      };

      const user = await User.create(userData);
      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.createdAt).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Test User',
        roles: ['user']
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Source Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user']
      });
    });

    it('should create source with valid data', async () => {
      const sourceData = {
        type: 'slack_channel',
        externalId: 'C123ABCDEF',
        name: 'general',
        userId: testUser._id,
        metadata: { workspace: 'test' }
      };

      const source = await Source.create(sourceData);
      expect(source._id).toBeDefined();
      expect(source.type).toBe(sourceData.type);
      expect(source.userId.toString()).toBe(testUser._id.toString());
    });

    it('should enforce unique constraint on type+externalId+userId', async () => {
      const sourceData = {
        type: 'slack_channel',
        externalId: 'C123ABCDEF',
        name: 'general',
        userId: testUser._id
      };

      await Source.create(sourceData);

      await expect(Source.create(sourceData)).rejects.toThrow();
    });
  });

  describe('Chunk Model', () => {
    let testSource;

    beforeEach(async () => {
      const testUser = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user']
      });

      testSource = await Source.create({
        type: 'slack_channel',
        externalId: 'C123ABCDEF',
        name: 'general',
        userId: testUser._id
      });
    });

    it('should create chunk with valid data', async () => {
      const chunkData = {
        sourceId: testSource._id,
        externalId: 'msg123',
        qdrantPointId: 'point123',
        text: 'This is a test chunk',
        startChar: 0,
        endChar: 19,
        author: 'testuser',
        timestamp: new Date()
      };

      const chunk = await Chunk.create(chunkData);
      expect(chunk._id).toBeDefined();
      expect(chunk.text).toBe(chunkData.text);
      expect(chunk.sourceId.toString()).toBe(testSource._id.toString());
    });

    it('should populate source information', async () => {
      const chunk = await Chunk.create({
        sourceId: testSource._id,
        externalId: 'msg123',
        qdrantPointId: 'point123',
        text: 'Test chunk',
        startChar: 0,
        endChar: 10,
        author: 'testuser',
        timestamp: new Date()
      });

      const populatedChunk = await Chunk.findById(chunk._id)
        .populate('sourceId')
        .exec();

      expect(populatedChunk.sourceId.name).toBe(testSource.name);
      expect(populatedChunk.sourceId.type).toBe(testSource.type);
    });
  });

  describe('Database Indexes', () => {
    it('should have proper indexes on User collection', async () => {
      const indexes = await User.collection.getIndexes();
      const indexNames = Object.keys(indexes);
      
      expect(indexNames).toContain('email_1');
    });

    it('should have proper indexes on Chunk collection', async () => {
      const indexes = await Chunk.collection.getIndexes();
      const indexNames = Object.keys(indexes);
      
      expect(indexNames.some(name => name.includes('sourceId'))).toBe(true);
      expect(indexNames.some(name => name.includes('qdrantPointId'))).toBe(true);
    });
  });
});
