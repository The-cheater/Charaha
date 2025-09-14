const crypto = require('crypto');
const slackService = require('../services/slack.service');
const googleService = require('../services/google.service');
const ingestService = require('../services/ingest.service');
const logger = require('../utils/logger');

class WebhookController {
  async handleSlackEvent(req, res, next) {
    try {
      // Verify Slack request signature
      const signature = req.headers['x-slack-signature'];
      const timestamp = req.headers['x-slack-request-timestamp'];
      const body = JSON.stringify(req.body);

      if (!this.verifySlackSignature(signature, timestamp, body)) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid Slack signature'
        });
      }

      const { type, event, challenge } = req.body;

      // Handle URL verification challenge
      if (type === 'url_verification') {
        return res.status(200).json({ challenge });
      }

      // Handle events
      if (type === 'event_callback' && event) {
        await this.processSlackEvent(event);
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      logger.error('Slack webhook error:', error);
      next(error);
    }
  }

  async processSlackEvent(event) {
    const { type, channel, user, text, ts, thread_ts } = event;

    switch (type) {
      case 'message':
        // Skip bot messages and message edits
        if (event.subtype) return;
        
        // Find users who have this channel ingested
        const sources = await Source.find({ 
          type: 'slack_channel', 
          externalId: channel 
        }).populate('userId');

        // Process message for each user
        for (const source of sources) {
          await ingestService.processSlackMessage({
            message: event,
            channelId: channel,
            userId: source.userId._id
          });
        }
        break;

      default:
        logger.info(`Unhandled Slack event type: ${type}`);
    }
  }

  verifySlackSignature(signature, timestamp, body) {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    
    // Check timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > 300) {
      return false;
    }

    // Create expected signature
    const hmac = crypto.createHmac('sha256', signingSecret);
    hmac.update(`v0:${timestamp}:${body}`);
    const expectedSignature = `v0=${hmac.digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async handleSlackInteraction(req, res, next) {
    try {
      const payload = JSON.parse(req.body.payload);
      const { type, user, actions } = payload;

      // Handle different interaction types
      switch (type) {
        case 'block_actions':
          await this.handleSlackBlockActions(payload);
          break;
        case 'shortcut':
          await this.handleSlackShortcut(payload);
          break;
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      logger.error('Slack interaction error:', error);
      next(error);
    }
  }

  async handleDriveChange(req, res, next) {
    try {
      const { resourceId, resourceUri, eventType } = req.body;

      logger.info(`Drive change notification: ${eventType} for ${resourceId}`);

      // Find sources that match this resource
      const sources = await Source.find({
        type: { $in: ['google_doc', 'google_drive_folder'] },
        externalId: resourceId
      }).populate('userId');

      // Process changes for each user
      for (const source of sources) {
        await ingestService.processDriveChange({
          resourceId,
          resourceUri,
          eventType,
          userId: source.userId._id
        });
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      logger.error('Drive webhook error:', error);
      next(error);
    }
  }

  async handleSlackBlockActions(payload) {
    // Handle button clicks, menu selections, etc.
    logger.info('Slack block action:', payload.actions[0]);
  }

  async handleSlackShortcut(payload) {
    // Handle shortcuts
    logger.info('Slack shortcut:', payload.callback_id);
  }
}

module.exports = new WebhookController();
