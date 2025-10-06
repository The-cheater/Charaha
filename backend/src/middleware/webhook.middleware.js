const crypto = require('crypto');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/helpers');

class WebhookMiddleware {
  /**
   * Verify Slack webhook signature
   */
  verifySlackSignature(req, res, next) {
    try {
      const slackSignature = req.headers['x-slack-signature'];
      const timestamp = req.headers['x-slack-request-timestamp'];
      
      if (!slackSignature || !timestamp) {
        return errorResponse(res, 'Missing Slack signature headers', 400);
      }

      // Check timestamp (prevent replay attacks)
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - timestamp) > 300) { // 5 minutes
        return errorResponse(res, 'Request timestamp too old', 400);
      }

      // Verify signature
      const sigBasestring = `v0:${timestamp}:${req.rawBody}`;
      const expectedSignature = `v0=${crypto
        .createHmac('sha256', process.env.SLACK_SIGNING_SECRET)
        .update(sigBasestring)
        .digest('hex')}`;

      if (!crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(slackSignature)
      )) {
        logger.warn('⚠️ Invalid Slack signature');
        return errorResponse(res, 'Invalid signature', 401);
      }

      next();
    } catch (error) {
      logger.error('❌ Slack signature verification failed:', error);
      return errorResponse(res, 'Signature verification failed', 401);
    }
  }

  /**
   * Verify Google Drive push notification
   */
  verifyDriveWebhook(req, res, next) {
    try {
      const channelToken = req.headers['x-goog-channel-token'];
      const expectedToken = process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN;

      if (expectedToken && channelToken !== expectedToken) {
        logger.warn('⚠️ Invalid Google Drive webhook token');
        return errorResponse(res, 'Invalid webhook token', 401);
      }

      // Additional verification could include checking the resource URI
      const resourceUri = req.headers['x-goog-resource-uri'];
      if (!resourceUri) {
        return errorResponse(res, 'Missing resource URI', 400);
      }

      next();
    } catch (error) {
      logger.error('❌ Drive webhook verification failed:', error);
      return errorResponse(res, 'Webhook verification failed', 401);
    }
  }

  /**
   * Verify GitHub webhook signature
   */
  verifyGitHubSignature(req, res, next) {
    try {
      const signature = req.headers['x-hub-signature-256'];
      const secret = process.env.GITHUB_WEBHOOK_SECRET;

      if (!secret) {
        logger.warn('⚠️ GitHub webhook secret not configured');
        return next(); // Skip verification if no secret configured
      }

      if (!signature) {
        return errorResponse(res, 'Missing GitHub signature', 400);
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(req.rawBody)
        .digest('hex');

      if (!crypto.timingSafeEqual(
        Buffer.from(`sha256=${expectedSignature}`),
        Buffer.from(signature)
      )) {
        logger.warn('⚠️ Invalid GitHub signature');
        return errorResponse(res, 'Invalid signature', 401);
      }

      next();
    } catch (error) {
      logger.error('❌ GitHub signature verification failed:', error);
      return errorResponse(res, 'Signature verification failed', 401);
    }
  }

  /**
   * Rate limiting for webhooks
   */
  webhookRateLimit(req, res, next) {
    // Implement rate limiting specific to webhooks
    // This could use Redis or in-memory storage
    
    const clientId = this.getClientIdentifier(req);
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // Max 100 webhooks per minute per client

    // Simple in-memory rate limiting (use Redis for production)
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, requests] of this.rateLimitStore.entries()) {
      const filteredRequests = requests.filter(time => time > windowStart);
      if (filteredRequests.length === 0) {
        this.rateLimitStore.delete(key);
      } else {
        this.rateLimitStore.set(key, filteredRequests);
      }
    }

    // Check current client
    const clientRequests = this.rateLimitStore.get(clientId) || [];
    const recentRequests = clientRequests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      logger.warn(`⚠️ Webhook rate limit exceeded for client: ${clientId}`);
      return errorResponse(res, 'Rate limit exceeded', 429);
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimitStore.set(clientId, recentRequests);

    next();
  }

  /**
   * Get client identifier for rate limiting
   */
  getClientIdentifier(req) {
    // Use different identifiers for different webhook types
    const slackTeamId = req.body?.team_id;
    if (slackTeamId) return `slack_${slackTeamId}`;

    const driveChannelId = req.headers['x-goog-channel-id'];
    if (driveChannelId) return `drive_${driveChannelId}`;

    return req.ip; // Fallback to IP address
  }

  /**
   * Parse raw body for signature verification
   */
  parseRawBody(req, res, next) {
    let rawBody = '';
    
    req.on('data', (chunk) => {
      rawBody += chunk.toString();
    });

    req.on('end', () => {
      req.rawBody = rawBody;
      next();
    });
  }

  /**
   * Log webhook requests for monitoring
   */
  logWebhookRequest(req, res, next) {
    const startTime = Date.now();
    
    // Log request details
    logger.info(`📨 Webhook ${req.method} ${req.path}`, {
      headers: {
        'content-type': req.headers['content-type'],
        'x-slack-signature': req.headers['x-slack-signature'] ? '[PRESENT]' : '[MISSING]',
        'x-goog-channel-id': req.headers['x-goog-channel-id'],
        'x-github-event': req.headers['x-github-event']
      },
      bodySize: req.headers['content-length']
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info(`📤 Webhook response ${res.statusCode} in ${duration}ms`);
    });

    next();
  }
}

module.exports = new WebhookMiddleware();
