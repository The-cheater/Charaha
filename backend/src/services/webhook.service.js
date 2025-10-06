const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.socketUsers = new Map(); // socket ID -> user data
    this.isInitialized = false;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    try {
      this.io = new Server(server, {
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:3000',
          credentials: true
        },
        transports: ['websocket', 'polling']
      });

      this.setupMiddleware();
      this.setupEventHandlers();
      this.isInitialized = true;
      
      logger.info('✅ WebSocket server initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/mongodb/user.model');
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userEmail = user.email;
        socket.userData = {
          id: user._id,
          email: user.email,
          name: user.name
        };

        logger.debug(`🔐 WebSocket authenticated: ${user.email}`);
        next();
      } catch (error) {
        logger.warn(`⚠️ WebSocket authentication failed: ${error.message}`);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    
    // Track user connections
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket.id);
    this.socketUsers.set(socket.id, socket.userData);

    // Join user-specific room
    socket.join(`user_${userId}`);

    logger.info(`📡 WebSocket connected: ${socket.userEmail} (${socket.id})`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'WebSocket connected successfully',
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // Handle search events
    socket.on('search_request', (data) => this.handleSearchRequest(socket, data));
    socket.on('search_suggestion_request', (data) => this.handleSearchSuggestions(socket, data));

    // Handle ingestion events
    socket.on('ingestion_start', (data) => this.handleIngestionStart(socket, data));
    socket.on('ingestion_status_request', (data) => this.handleIngestionStatus(socket, data));

    // Handle analytics events
    socket.on('analytics_request', (data) => this.handleAnalyticsRequest(socket, data));
    socket.on('dashboard_request', () => this.handleDashboardRequest(socket));

    // Handle real-time notifications
    socket.on('join_room', (room) => socket.join(room));
    socket.on('leave_room', (room) => socket.leave(room));

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`❌ WebSocket error for ${socket.userEmail}:`, error);
    });
  }

  /**
   * Handle search requests via WebSocket
   */
  async handleSearchRequest(socket, data) {
    try {
      const { query, filters = {} } = data;
      const userId = socket.userId;

      // Emit search started
      socket.emit('search_started', {
        query,
        timestamp: new Date().toISOString()
      });

      // Perform search
      const queryService = require('./query.service');
      const results = await queryService.search(userId, query, filters);

      // Emit results
      socket.emit('search_results', {
        query,
        results,
        timestamp: new Date().toISOString()
      });

      logger.debug(`🔍 WebSocket search completed for ${socket.userEmail}: "${query}"`);
    } catch (error) {
      logger.error('❌ WebSocket search failed:', error);
      socket.emit('search_error', {
        error: error.message,
        query: data.query
      });
    }
  }

  /**
   * Handle search suggestions
   */
  async handleSearchSuggestions(socket, data) {
    try {
      const { query } = data;
      const userId = socket.userId;

      const analyticsService = require('./analytics.service');
      const suggestions = await analyticsService.generateSuggestions(userId, query, 5);

      socket.emit('search_suggestions', {
        query,
        suggestions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ WebSocket search suggestions failed:', error);
      socket.emit('suggestions_error', { error: error.message });
    }
  }

  /**
   * Handle ingestion start
   */
  async handleIngestionStart(socket, data) {
    try {
      const userId = socket.userId;
      
      socket.emit('ingestion_started', {
        sourceId: data.sourceId,
        type: data.type,
        timestamp: new Date().toISOString()
      });

      logger.debug(`📥 WebSocket ingestion started for ${socket.userEmail}`);
    } catch (error) {
      logger.error('❌ WebSocket ingestion start failed:', error);
      socket.emit('ingestion_error', { error: error.message });
    }
  }

  /**
   * Handle ingestion status requests
   */
  async handleIngestionStatus(socket, data) {
    try {
      const userId = socket.userId;
      const Source = require('../models/mongodb/source.model');
      
      const sources = await Source.find({ userId })
        .select('name type status stats lastSyncAt')
        .sort({ createdAt: -1 });

      socket.emit('ingestion_status', {
        sources,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ WebSocket ingestion status failed:', error);
      socket.emit('status_error', { error: error.message });
    }
  }

  /**
   * Handle analytics requests
   */
  async handleAnalyticsRequest(socket, data) {
    try {
      const userId = socket.userId;
      const { timeframe = 30 } = data;

      const analyticsService = require('./analytics.service');
      const analytics = await analyticsService.getUserAnalytics(userId, timeframe);

      socket.emit('analytics_data', {
        analytics,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ WebSocket analytics request failed:', error);
      socket.emit('analytics_error', { error: error.message });
    }
  }

  /**
   * Handle dashboard requests
   */
  async handleDashboardRequest(socket) {
    try {
      const userId = socket.userId;
      
      const analyticsService = require('./analytics.service');
      const dashboardData = await analyticsService.getDashboardData(userId);

      socket.emit('dashboard_data', dashboardData);
    } catch (error) {
      logger.error('❌ WebSocket dashboard request failed:', error);
      socket.emit('dashboard_error', { error: error.message });
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(socket, reason) {
    const userId = socket.userId;
    
    // Remove from tracking
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socket.id);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketUsers.delete(socket.id);

    logger.info(`📡 WebSocket disconnected: ${socket.userEmail} (${reason})`);
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId, event, data) {
    if (!this.isInitialized) return;
    
    try {
      this.io.to(`user_${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Failed to emit to user:', error);
    }
  }

  /**
   * Emit event to all connected users
   */
  emitToAll(event, data) {
    if (!this.isInitialized) return;
    
    try {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Failed to emit to all users:', error);
    }
  }

  /**
   * Emit ingestion progress update
   */
  emitIngestionProgress(userId, sourceId, progress) {
    this.emitToUser(userId, 'ingestion_progress', {
      sourceId,
      progress: {
        stage: progress.stage,
        processed: progress.processed,
        total: progress.total,
        percentage: Math.round((progress.processed / progress.total) * 100),
        message: progress.message,
        eta: progress.eta
      }
    });
  }

  /**
   * Emit search analytics update
   */
  emitSearchUpdate(userId, searchData) {
    this.emitToUser(userId, 'search_update', searchData);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.socketUsers.size,
      uniqueUsers: this.userSockets.size,
      isInitialized: this.isInitialized,
      uptime: process.uptime()
    };
  }

  /**
   * Get connected users
   */
  getConnectedUsers() {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }
}

module.exports = new WebSocketService();
