const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const queryRoutes = require('./routes/query.routes');
const ingestRoutes = require('./routes/ingest.routes');
const webhookRoutes = require('./routes/webhook.routes');
const googleDriveRoutes = require('./routes/google-drive.routes');

// Import services
const vectorService = require('./services/vector.service');
const slackService = require('./services/slack.service');
const websocketService = require('./services/webhook.service');
const analyticsService = require('./services/analytics.service');
const embeddingService = require('./services/embedding.service');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourfrontend.com']
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// API versioning prefix
const API_PREFIX = '/api/v1';

// Routes with API prefix
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/query`, queryRoutes);
app.use(`${API_PREFIX}/ingest`, ingestRoutes);
app.use(`${API_PREFIX}/webhook`, webhookRoutes);
app.use(`${API_PREFIX}/google-drive`, googleDriveRoutes);

// Legacy routes (for backward compatibility)
app.use('/auth', authRoutes);
app.use('/query', queryRoutes);
app.use('/ingest', ingestRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/google-drive', googleDriveRoutes);

// Enhanced health endpoint with comprehensive status
app.get(['/health', `${API_PREFIX}/health`], async (req, res) => {
  try {
    const healthChecks = {};
    
    // Check MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    healthChecks.mongodb = { 
      status: mongoStatus,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
    
    // Check Vector Service
    try {
      const vectorHealth = await vectorService.getCollectionInfo();
      healthChecks.vector_db = { 
        status: 'healthy',
        ...vectorHealth
      };
    } catch (error) {
      healthChecks.vector_db = { 
        status: 'error', 
        message: error.message 
      };
    }
    
    // Check Embedding Service
    try {
      const embeddingHealth = await embeddingService.healthCheck();
      healthChecks.embedding_service = embeddingHealth;
    } catch (error) {
      healthChecks.embedding_service = { 
        status: 'error', 
        message: error.message 
      };
    }
    
    // Check WebSocket Service
    healthChecks.websocket = websocketService.getStats();
    
    // Check Slack Service
    let slackHealth = { status: 'not_configured' };
    if (process.env.SLACK_BOT_TOKEN) {
      try {
        slackHealth = await slackService.testConnection();
      } catch (error) {
        slackHealth = { status: 'error', message: error.message };
      }
    }
    healthChecks.slack = slackHealth;
    
    // Overall health status
    const allHealthy = Object.values(healthChecks).every(
      service => service.status === 'healthy' || service.status === 'connected' || service.status === 'not_configured'
    );
    
    const healthStatus = {
      status: allHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      services: healthChecks,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version
    };
    
    res.status(allHealthy ? 200 : 503).json(healthStatus);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error'
    });
  }
});

// API info endpoint
app.get(['/api/info', `${API_PREFIX}/info`], (req, res) => {
  res.json({
    name: 'TeamMemory API',
    version: '2.0.0',
    description: 'AI-powered team knowledge search system with real-time capabilities',
    features: [
      'Semantic search with vector embeddings',
      'Real-time WebSocket communication',
      'Slack message ingestion with webhooks',
      'Google Drive integration',
      'Advanced analytics and search history',
      'JWT authentication with OAuth',
      'Auto-ingestion with webhook triggers',
      'Progress tracking and notifications'
    ],
    endpoints: {
      authentication: {
        signup: `${API_PREFIX}/auth/signup`,
        login: `${API_PREFIX}/auth/login`,
        google_oauth: `${API_PREFIX}/auth/google`,
        refresh: `${API_PREFIX}/auth/refresh`
      },
      search: {
        query: `${API_PREFIX}/query`,
        advanced: `${API_PREFIX}/query/advanced`,
        suggestions: `${API_PREFIX}/query/suggestions`,
        history: `${API_PREFIX}/query/history`
      },
      ingestion: {
        slack: `${API_PREFIX}/ingest/slack`,
        google_drive: `${API_PREFIX}/ingest/google-drive`,
        file_upload: `${API_PREFIX}/ingest/file`,
        url: `${API_PREFIX}/ingest/url`,
        status: `${API_PREFIX}/ingest/status`
      },
      google_drive: {
        search: `${API_PREFIX}/google-drive/files`,
        folders: `${API_PREFIX}/google-drive/folders`,
        content: `${API_PREFIX}/google-drive/files/{fileId}/content`
      },
      webhooks: {
        slack: `${API_PREFIX}/webhook/slack/events`,
        google_drive: `${API_PREFIX}/webhook/drive/changes`,
        github: `${API_PREFIX}/webhook/github`
      },
      system: {
        health: `${API_PREFIX}/health`,
        info: `${API_PREFIX}/info`,
        websocket: 'ws://localhost:4000'
      }
    },
    websocket_events: {
      client_to_server: [
        'search_request',
        'ingestion_start',
        'analytics_request',
        'dashboard_request'
      ],
      server_to_client: [
        'search_results',
        'ingestion_progress',
        'analytics_update',
        'dashboard_data'
      ]
    }
  });
});

// Analytics endpoint for public metrics
app.get(['/metrics', `${API_PREFIX}/metrics`], async (req, res) => {
  try {
    const metrics = {
      websocket_connections: websocketService.getStats(),
      embedding_cache: embeddingService.getStats(),
      system: {
        uptime: Math.floor(process.uptime()),
        memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        node_version: process.version,
        platform: process.platform
      }
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    suggestion: `Try ${API_PREFIX}/info for available endpoints`,
    availableRoutes: [
      `${API_PREFIX}/auth`,
      `${API_PREFIX}/query`,
      `${API_PREFIX}/ingest`,
      `${API_PREFIX}/webhook`,
      `${API_PREFIX}/google-drive`,
      `${API_PREFIX}/health`,
      `${API_PREFIX}/info`
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error with context
  logger.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: process.env.NODE_ENV !== 'production' ? req.body : '[REDACTED]'
  });
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(err.status || 500).json({
    status: 'error',
    message: message,
    requestId: req.id,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err.details 
    })
  });
});

const PORT = parseInt(process.env.PORT, 10) || 4000;

// Enhanced startup sequence with comprehensive service initialization
async function startServer() {
  try {
    logger.info('🚀 Starting TeamMemory server...');
    logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🔧 Node.js version: ${process.version}`);
    
    // 1. Connect to MongoDB
    logger.info('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    // Setup MongoDB event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    logger.info('✅ MongoDB connected successfully');
    
    // 2. Initialize Vector Database
    logger.info('🧠 Initializing vector database...');
    await vectorService.initializeCollection();
    logger.info('✅ Vector database initialized');
    
    // 3. Initialize Embedding Service
    logger.info('🤖 Initializing embedding service...');
    const embeddingHealth = await embeddingService.healthCheck();
    if (embeddingHealth.status === 'healthy') {
      logger.info('✅ Embedding service initialized');
    } else {
      logger.warn('⚠️ Embedding service health check failed:', embeddingHealth);
    }
    
    // 4. Initialize Slack Service (if configured)
    if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET) {
      try {
        logger.info('💬 Initializing Slack service...', {
          hasToken: !!process.env.SLACK_BOT_TOKEN,
          hasSigningSecret: !!process.env.SLACK_SIGNING_SECRET
        });
        
        // Ensure Slack client is initialized with the bot token before testing
        if (!slackService.isInitialized) {
          await slackService.initializeClient(process.env.SLACK_BOT_TOKEN);
          logger.info('✅ Slack client initialized');
        }
        
        const slackConnection = await slackService.testConnection();
        if (slackConnection.connected) {
          logger.info('✅ Slack service initialized', {
            team: slackConnection.team,
            user: slackConnection.user
          });
        } else {
          throw new Error(slackConnection.error || 'Unknown error during Slack connection test');
        }
      } catch (error) {
        logger.error('❌ Slack service initialization failed:', {
          error: error.message,
          stack: error.stack
        });
        logger.warn('⚠️ Slack features will be unavailable');
      }
    } else {
      const missingConfig = [];
      if (!process.env.SLACK_BOT_TOKEN) missingConfig.push('SLACK_BOT_TOKEN');
      if (!process.env.SLACK_SIGNING_SECRET) missingConfig.push('SLACK_SIGNING_SECRET');
      
      logger.warn(`⚠️ Slack features disabled - Missing configuration: ${missingConfig.join(', ')}`);
    }
    
    // 5. Create HTTP server
    const server = http.createServer(app);

    // 6. Initialize WebSocket service
    logger.info('📡 Initializing WebSocket service...');
    websocketService.initialize(server);
    logger.info('✅ WebSocket service initialized');

    // 7. Start the server with port fallback
    const startListening = (port, attemptsLeft = 5) => {
      const onError = (err) => {
        if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
          const nextPort = port + 1;
          logger.warn(`Port ${port} in use, retrying on ${nextPort} (remaining attempts: ${attemptsLeft - 1})`);
          server.removeListener('listening', onListening);
          server.removeListener('error', onError);
          setTimeout(() => startListening(nextPort, attemptsLeft - 1), 200);
        } else {
          throw err;
        }
      };

      const onListening = () => {
        const address = server.address();
        const activePort = typeof address === 'string' ? PORT : address.port;
        logger.info(`🌟 Server running successfully on port ${activePort}`);
        logger.info(`📋 Health check: http://localhost:${activePort}/health`);
        logger.info(`📚 API info: http://localhost:${activePort}${API_PREFIX}/info`);
        logger.info(`📊 Metrics: http://localhost:${activePort}/metrics`);
        logger.info(`📡 WebSocket: ws://localhost:${activePort}`);
        logger.info(`🎉 TeamMemory API v2.0 is ready!`);

        const wsStats = websocketService.getStats();
        logger.info(`📡 WebSocket connections: ${wsStats.totalConnections}`);
        logger.info(`🧠 Vector DB status: healthy`);
        logger.info(`🤖 Embedding service: ready`);
        server.removeListener('error', onError);
      };

      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(port);
    };

    startListening(PORT);
    
    // 8. Setup periodic cleanup tasks
    setupPeriodicTasks();
    
    // 9. Setup graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`🛑 Received ${signal}, shutting down gracefully...`);
      
      server.close(async () => {
        try {
          // Close database connections
          await mongoose.connection.close();
          
          // Clean up services
          embeddingService.clearCache();
          
          logger.info('✅ Server and database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Setup periodic cleanup and maintenance tasks
function setupPeriodicTasks() {
  // Clean up old analytics data every day
  setInterval(async () => {
    try {
      await analyticsService.cleanupOldData(90); // Keep 90 days
      logger.info('🧹 Completed analytics cleanup');
    } catch (error) {
      logger.error('❌ Analytics cleanup failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  // Clear embedding cache every hour
  setInterval(() => {
    if (embeddingService.getStats().cacheSize > 500) {
      embeddingService.clearCache();
      logger.info('🧹 Cleared embedding cache');
    }
  }, 60 * 60 * 1000); // 1 hour
  
  // Log system stats every 10 minutes
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const wsStats = websocketService.getStats();
    
    logger.info('📊 System stats:', {
      uptime: Math.floor(process.uptime()),
      memory: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      connections: wsStats.totalConnections,
      users: wsStats.uniqueUsers
    });
  }, 10 * 60 * 1000); // 10 minutes
}

// Enhanced error handling for unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason,
    promise: promise,
    stack: reason?.stack
  });
  
  // Don't exit in production, just log
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack
  });
  
  // Exit gracefully
  process.exit(1);
});

// Handle warning events
process.on('warning', (warning) => {
  logger.warn('Process Warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// Start the server
startServer().catch(error => {
  logger.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
