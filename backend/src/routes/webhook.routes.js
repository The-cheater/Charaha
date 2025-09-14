const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Slack webhook endpoints
router.post('/slack/events', webhookController.handleSlackEvent);
router.post('/slack/interactive', webhookController.handleSlackInteraction);

// Google Drive webhook endpoints
router.post('/drive/changes', webhookController.handleDriveChange);

module.exports = router;
