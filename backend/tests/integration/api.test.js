const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/mongodb/user.model');
const Source = require('../../src/models/mongodb/source.model');

describe('API Integration Tests', () => {
  let authToken, testUser;

  beforeEach(async () => {
    // Create a test user and get auth token
    testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      roles: ['user']
    });

    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET);
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Test signup
      const signupResponse = await request(app)
        .post('/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'NewPass123!',
          name: 'New User'
        })
        .expect(201);

      expect(signupResponse.body.data.token).toBeDefined();

      // Test login with new credentials
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'NewPass123!'
        })
        .expect(200);

      // Test accessing protected route
      const profileResponse = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
        .expect(200);

      expect(profileResponse.body.data.user.email).toBe('newuser@example.com');
    });
  });

  describe('Source Management', () => {
    it('should create and retrieve sources', async () => {
      // Create a source via ingestion endpoint (mocked)
      const sourceData = {
        channel: 'C123ABCDEF',
        workspace: 'test-workspace'
      };

      // Note: This would normally trigger actual ingestion
      // For testing, we'll create the source directly
      const source = await Source.create({
        type: 'slack_channel',
        externalId: sourceData.channel,
        name: 'test-channel',
        userId: testUser._id,
        metadata: { workspace: sourceData.workspace }
      });

      // Test getting sources
      const response = await request(app)
        .get('/ingest/sources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.sources).toHaveLength(1);
      expect(response.body.data.sources[0].name).toBe('test-channel');
    });

    it('should delete sources with cleanup', async () => {
      const source = await Source.create({
        type: 'slack_channel',
        externalId: 'C123ABCDEF',
        name: 'test-channel',
        userId: testUser._id
      });

      const response = await request(app)
        .delete(`/ingest/sources/${source._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');

      // Verify source is deleted
      const deletedSource = await Source.findById(source._id);
      expect(deletedSource).toBeNull();
    });
  });

  describe('Search Flow', () => {
    it('should handle search requests', async () => {
      const searchQuery = {
        query: 'test search query',
        topK: 5
      };

      const response = await request(app)
        .post('/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchQuery)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.query).toBe(searchQuery.query);
      expect(response.body.data.results).toBeInstanceOf(Array);
    });

    it('should get search history', async () => {
      const response = await request(app)
        .get('/query/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.history).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 routes', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Route not found');
    });

    it('should handle unauthorized requests', async () => {
      const response = await request(app)
        .get('/query/history')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('No token provided');
    });
  });
});
