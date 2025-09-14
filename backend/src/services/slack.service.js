const { WebClient } = require('@slack/web-api');
const logger = require('../utils/logger');

class SlackService {
  constructor() {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  async getChannelHistory(channelId, options = {}) {
    try {
      const { oldest, latest, limit = 100 } = options;
      
      const result = await this.client.conversations.history({
        channel: channelId,
        oldest,
        latest,
        limit
      });

      return result.messages || [];
    } catch (error) {
      logger.error(`Error fetching Slack history for channel ${channelId}:`, error);
      throw error;
    }
  }

  async getChannelInfo(channelId) {
    try {
      const result = await this.client.conversations.info({
        channel: channelId
      });

      return result.channel;
    } catch (error) {
      logger.error(`Error fetching channel info for ${channelId}:`, error);
      throw error;
    }
  }

  async getUserInfo(userId) {
    try {
      const result = await this.client.users.info({
        user: userId
      });

      return result.user;
    } catch (error) {
      logger.error(`Error fetching user info for ${userId}:`, error);
      throw error;
    }
  }

  async getThreadReplies(channelId, threadTs) {
    try {
      const result = await this.client.conversations.replies({
        channel: channelId,
        ts: threadTs
      });

      return result.messages || [];
    } catch (error) {
      logger.error(`Error fetching thread replies:`, error);
      throw error;
    }
  }

  async getAllChannels() {
    try {
      const result = await this.client.conversations.list({
        types: 'public_channel,private_channel'
      });

      return result.channels || [];
    } catch (error) {
      logger.error('Error fetching all channels:', error);
      throw error;
    }
  }

  formatMessageText(text) {
    if (!text) return '';
    
    // Convert Slack formatting to plain text
    return text
      .replace(/<@U[A-Z0-9]+>/g, '@user') // User mentions
      .replace(/<#C[A-Z0-9]+\|([^>]+)>/g, '#$1') // Channel mentions
      .replace(/<(https?:\/\/[^|>]+)(\|([^>]+))?>/g, '$3 $1') // Links
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}

module.exports = new SlackService();
