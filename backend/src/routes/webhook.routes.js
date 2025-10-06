const express = require('express');
const webhookController = require('../controllers/webhook.controller');
const webhookMiddleware = require('../middleware/webhook.middleware');

const router = express.Router();

// Middleware for all webhook routes
router.use(webhookMiddleware.parseRawBody);
router.use(webhookMiddleware.logWebhookRequest);
router.use(webhookMiddleware.webhookRateLimit);

// Slack webhook endpoints
router.post('/slack/events', 
  webhookMiddleware.verifySlackSignature,
  webhookController.handleSlackEvent
);

router.post('/slack/interactive',
  webhookMiddleware.verifySlackSignature, 
  webhookController.handleSlackInteraction
);

// Google Drive webhook endpoints
router.post('/drive/changes',
  webhookMiddleware.verifyDriveWebhook,
  webhookController.handleDriveChange
);

// GitHub webhook endpoints
router.post('/github',
  webhookMiddleware.verifyGitHubSignature,
  webhookController.handleGitHubWebhook
);

// Health check for webhook endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhooks: ['slack', 'google-drive', 'github']
  });
});

module.exports = router;
