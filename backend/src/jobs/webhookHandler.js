const slackService = require('../services/slack.service');
const googleService = require('../services/google.service');
const ingestService = require('../services/ingest.service');
const Source = require('../models/mongodb/source.model');
const logger = require('../utils/logger');

class WebhookHandler {
  async processSlackWebhook(payload) {
    try {
      const { type, event } = payload;

      if (type === 'event_callback' && event) {
        await this.handleSlackEvent(event);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error processing Slack webhook:', error);
      throw error;
    }
  }

  async handleSlackEvent(event) {
    const { type, channel, user, text, ts, thread_ts } = event;

    switch (type) {
      case 'message':
        // Skip bot messages and message edits
        if (event.subtype || event.bot_id) return;
        
        await this.processSlackMessage(event);
        break;

      case 'message_changed':
        await this.updateSlackMessage(event);
        break;

      case 'message_deleted':
        await this.deleteSlackMessage(event);
        break;

      default:
        logger.info(`Unhandled Slack event type: ${type}`);
    }
  }

  async processSlackMessage(message) {
    try {
      // Find all sources that have this channel
      const sources = await Source.find({
        type: 'slack_channel',
        externalId: message.channel
      }).populate('userId');

      // Process the message for each user who has ingested this channel
      for (const source of sources) {
        await ingestService.processSlackMessage({
          message,
          channelId: message.channel,
          userId: source.userId._id,
          sourceId: source._id
        });
      }

      logger.info(`Processed real-time Slack message ${message.ts} for ${sources.length} users`);
    } catch (error) {
      logger.error('Error processing Slack message:', error);
      throw error;
    }
  }

  async updateSlackMessage(event) {
    // Handle message updates
    const { message, previous_message } = event;
    logger.info(`Slack message updated: ${message.ts}`);
    
    // You could implement logic to update the existing chunks
    await this.processSlackMessage(message);
  }

  async deleteSlackMessage(event) {
    // Handle message deletions
    const { deleted_ts, channel } = event;
    logger.info(`Slack message deleted: ${deleted_ts} in channel ${channel}`);
    
    // You could implement logic to remove chunks from vector DB
  }

  async processDriveWebhook(payload) {
    try {
      const { resourceId, resourceUri, eventType } = payload;

      logger.info(`Drive webhook: ${eventType} for resource ${resourceId}`);

      // Find sources that match this resource
      const sources = await Source.find({
        type: { $in: ['google_doc', 'google_drive_folder'] },
        externalId: resourceId
      }).populate('userId');

      // Process changes for each user
      for (const source of sources) {
        await this.handleDriveChange({
          resourceId,
          resourceUri,
          eventType,
          source
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error processing Drive webhook:', error);
      throw error;
    }
  }

  async handleDriveChange({ resourceId, resourceUri, eventType, source }) {
    try {
      switch (eventType) {
        case 'update':
        case 'change':
          // Re-ingest the updated file
          await ingestService.ingestGoogleDrive({
            fileId: resourceId,
            userId: source.userId._id,
            since: source.lastSyncAt
          });
          break;

        case 'trash':
          // Remove the file from our system
          await ingestService.deleteSource(source._id, source.userId._id);
          break;

        default:
          logger.info(`Unhandled Drive event type: ${eventType}`);
      }
    } catch (error) {
      logger.error('Error handling Drive change:', error);
      throw error;
    }
  }
}

module.exports = new WebhookHandler();
