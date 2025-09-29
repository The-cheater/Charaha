const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const queryRoutes = require('./routes/query.routes');
const ingestRoutes = require('./routes/ingest.routes');
const webhookRoutes = require('./routes/webhook.routes');
const googleDriveRoutes = require('./routes/google-drive.routes');

// Import services - FIXED: Import classes, not instances
const VectorService = require('./services/vector.service');
const slackService = require('./services/slack.service');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourfrontend.com'] : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/query', queryRoutes);
app.use('/ingest', ingestRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/google-drive', googleDriveRoutes);

// Health endpoint with detailed status
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check Vector Service - FIXED: Create instance
    const vectorService = new VectorService();
    const vectorHealth = await vectorService.healthCheck();
    
    // Check Slack Service
    let slackHealth = { status: 'not_configured' };
    if (process.env.SLACK_BOT_TOKEN) {
      try {
        slackHealth = await slackService.healthCheck();
      } catch (error) {
        slackHealth = { status: 'error', message: error.message };
      }
    }
    
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: { status: mongoStatus },
        vector_db: vectorHealth,
        slack: slackHealth
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'TeamMemory API',
    version: '1.0.0',
    description: 'AI-powered team knowledge search system',
    endpoints: {
      auth: '/auth/signup, /auth/login',
      search: '/query',
      ingestion: '/ingest/slack, /ingest/google-drive',
      webhooks: '/webhook/slack',
      googleDrive: '/api/google-drive/folders, /api/google-drive/files/search',
      health: '/health'
    },
    features: [
      'Semantic search with vector embeddings',
      'Slack message ingestion',
      'Google Drive integration',
      'Real-time webhooks',
      'JWT authentication'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: ['/auth', '/query', '/ingest', '/webhook', '/api/google-drive', '/health', '/api/info']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  const message = process.env.NODE_ENV === 'production' ? 
    'Internal server error' : 
    err.message;
    
  res.status(err.status || 500).json({
    status: 'error',
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 4000;

// Enhanced startup sequence - FIXED: Proper service instantiation
async function startServer() {
  try {
    logger.info('🚀 Starting TeamMemory server...');
    
    // 1. Connect to MongoDB
    logger.info('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('✅ MongoDB connected successfully');
    
    // 2. Initialize Vector Database - FIXED: Create instance
    logger.info('🧠 Initializing vector database...');
    const vectorService = new VectorService();
    await vectorService.initializeCollection();
    logger.info('✅ Vector database initialized');
    
    // 3. Initialize Slack Service (if configured)
    if (process.env.SLACK_BOT_TOKEN) {
      try {
        logger.info('💬 Initializing Slack service...');
        // FIXED: Check if slackService has initialize method
        if (typeof slackService.initialize === 'function') {
          await slackService.initialize();
        }
        logger.info('✅ Slack service initialized');
      } catch (error) {
        logger.warn('⚠️ Slack service initialization failed:', error.message);
        logger.warn('Slack features will be unavailable');
      }
    } else {
      logger.info('⚠️ SLACK_BOT_TOKEN not configured, Slack features disabled');
    }
    
    // 4. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🌟 Server running successfully on port ${PORT}`);
      logger.info(`📋 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API info: http://localhost:${PORT}/api/info`);
      logger.info(`📁 Google Drive: http://localhost:${PORT}/api/google-drive/test`);
      logger.info('🎉 TeamMemory API is ready!');
    });
    
    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(async () => {
        try {
          await mongoose.connection.close();
          logger.info('Server and database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
