const { WebClient } = require('@slack/web-api');
const crypto = require('crypto');
const logger = require('../utils/logger');

class SlackService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.userCache = new Map();
    this.channelCache = new Map();
    this.token = null;
  }

  /**
   * Initialize Slack client with user token
   */
  async initializeClient(token) {
    try {
      if (!token) {
        throw new Error('No Slack token provided');
      }
      
      this.token = token;
      this.client = new WebClient(token, {
        // Add retry configuration
        retryConfig: {
          retries: 3,
          factor: 2,
          minTimeout: 1000,
          maxTimeout: 5000,
        },
        // Add logging
        logger: {
          debug: (...msgs) => logger.debug('Slack Client Debug:', ...msgs),
          log: (...msgs) => logger.info('Slack Client Log:', ...msgs),
          info: (...msgs) => logger.info('Slack Client Info:', ...msgs),
          warn: (...msgs) => logger.warn('Slack Client Warning:', ...msgs),
          error: (...msgs) => logger.error('Slack Client Error:', ...msgs)
        }
      });
      
      logger.info('Testing Slack API connection...');
      const auth = await this.client.auth.test().catch(err => {
        logger.error('Slack auth test failed:', {
          code: err.code,
          message: err.message,
          data: err.data
        });
        throw new Error(`Slack API error (${err.code || 'unknown'}): ${err.message}`);
      });
      
      if (!auth.ok) {
        throw new Error(`Slack auth test failed: ${auth.error || 'Unknown error'}`);
      }
      
      this.botUserId = auth.user_id;
      this.teamId = auth.team_id;
      this.teamName = auth.team;
      this.teamDomain = auth.url ? auth.url.replace('https://', '').replace('.slack.com/', '') : 'unknown';
      this.isInitialized = true;
      
      logger.info('✅ Slack client initialized', {
        team: this.teamName,
        userId: this.botUserId,
        teamId: this.teamId
      });
      
      return true;
    } catch (error) {
      this.isInitialized = false;
      logger.error('❌ Slack client initialization failed:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Test connection to Slack
   */
  async testConnection() {
    try {
      if (!this.isInitialized) {
        throw new Error('Slack client not initialized');
      }
      
      const auth = await this.client.auth.test();
      return {
        connected: true,
        team: auth.team,
        user: auth.user,
        teamId: auth.team_id,
        userId: auth.user_id
      };
    } catch (error) {
      logger.error('❌ Slack connection test failed:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Auto-join a specific channel
   */
  async joinChannel(channelId) {
    try {
      await this.client.conversations.join({ channel: channelId });
      logger.info(`✅ Bot joined channel: ${channelId}`);
      return true;
    } catch (error) {
      if (error.data?.error === 'already_in_channel') {
        logger.info(`Bot already in channel: ${channelId}`);
        return true;
      } else if (error.data?.error === 'cant_join_general') {
        logger.info(`Bot cannot join #general channel: ${channelId}`);
        return true;
      } else if (error.data?.error === 'channel_not_found') {
        logger.warn(`Channel not found: ${channelId}`);
        return false;
      } else if (error.data?.error === 'is_archived') {
        logger.warn(`Channel is archived: ${channelId}`);
        return false;
      } else if (error.data?.error === 'access_denied') {
        logger.warn(`Access denied to private channel: ${channelId}`);
        return false;
      }

      logger.error(`Failed to join channel ${channelId}:`, error.data?.error || error.message);
      return false;
    }
  }

  /**
   * Get all channels
   */
  async getChannels() {
    try {
      if (!this.isInitialized) await this.initialize();

      const channels = [];
      let cursor;

      do {
        const response = await this.client.conversations.list({
          types: 'public_channel,private_channel',
          cursor: cursor,
          limit: 200
        });

        channels.push(...response.channels);
        cursor = response.response_metadata?.next_cursor;
      } while (cursor);

      return channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private,
        memberCount: channel.num_members,
        topic: channel.topic?.value || '',
        purpose: channel.purpose?.value || '',
        created: new Date(channel.created * 1000).toISOString(),
        isMember: channel.is_member || false
      }));
    } catch (error) {
      logger.error('❌ Failed to get channels:', error);
      throw error;
    }
  }

  /**
   * Get messages from a channel
   */
  async getChannelMessages(channelId, options = {}) {
    try {
      if (!this.isInitialized) await this.initialize();

      const { oldest = null, latest = null, limit = 1000 } = options;
      const messages = [];
      let cursor;
      let hasMore = true;

      // Try to join channel first if we're not in it
      try {
        await this.joinChannel(channelId);
      } catch (error) {
        logger.warn(`Could not auto-join channel ${channelId}, trying to read anyway...`);
      }

      while (hasMore && messages.length < limit) {
        const response = await this.client.conversations.history({
          channel: channelId,
          oldest: oldest,
          latest: latest,
          cursor: cursor,
          limit: Math.min(200, limit - messages.length)
        });

        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }

        for (const message of response.messages) {
          // Skip bot messages and system messages
          if (message.subtype || message.bot_id) continue;
          // Skip empty messages
          if (!message.text || message.text.trim().length === 0) continue;

          messages.push(await this.formatMessage(message, channelId));
        }

        cursor = response.response_metadata?.next_cursor;
        hasMore = !!cursor && messages.length < limit;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info(`Retrieved ${messages.length} messages from channel ${channelId}`);
      return messages;
    } catch (error) {
      if (error.data?.error === 'not_in_channel') {
        logger.error(`Bot not in channel ${channelId}. Please invite the bot manually to this channel.`);
        throw new Error(`Bot not in channel ${channelId}. Please invite the bot to this channel in Slack.`);
      }

      logger.error(`Failed to get messages from channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Format message for vector storage
   */
  async formatMessage(message, channelId) {
    try {
      // Get user and channel info
      const user = await this.getUserInfo(message.user);
      const channel = await this.getChannelInfo(channelId);

      // Clean message text
      let text = message.text;
      text = await this.replaceMentions(text);
      text = await this.replaceChannelMentions(text);

      // Handle thread context
      let threadContext = '';
      if (message.thread_ts && message.thread_ts !== message.ts) {
        threadContext = ' [Reply in thread]';
      }

      return {
        id: crypto.randomUUID(),
        text: text + threadContext,
        metadata: {
          source: 'slack',
          messageId: message.ts,
          channelId: channelId,
          channelName: channel.name,
          userId: message.user,
          userName: user.name,
          userRealName: user.real_name,
          timestamp: new Date(parseFloat(message.ts) * 1000).toISOString(),
          threadTs: message.thread_ts || null,
          replyCount: message.reply_count || 0,
          reactions: message.reactions || [],
          permalink: `https://${this.teamDomain}.slack.com/archives/${channelId}/p${message.ts.replace('.', '')}`
        }
      };
    } catch (error) {
      logger.error('❌ Failed to format message:', error);
      throw error;
    }
  }

  /**
   * Get user info (with caching)
   */
  async getUserInfo(userId) {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId);
    }

    try {
      const response = await this.client.users.info({ user: userId });
      const user = {
        id: response.user.id,
        name: response.user.name,
        real_name: response.user.real_name || response.user.name,
        display_name: response.user.profile?.display_name || response.user.name,
        email: response.user.profile?.email,
        image: response.user.profile?.image_72
      };

      this.userCache.set(userId, user);
      return user;
    } catch (error) {
      logger.warn(`Failed to get user info for ${userId}:`, error);
      return { id: userId, name: 'Unknown User', real_name: 'Unknown User' };
    }
  }

  /**
   * Get channel info (with caching)
   */
  async getChannelInfo(channelId) {
    if (this.channelCache.has(channelId)) {
      return this.channelCache.get(channelId);
    }

    try {
      const response = await this.client.conversations.info({ channel: channelId });
      const channel = {
        id: response.channel.id,
        name: response.channel.name,
        isPrivate: response.channel.is_private,
        topic: response.channel.topic?.value || '',
        purpose: response.channel.purpose?.value || ''
      };

      this.channelCache.set(channelId, channel);
      return channel;
    } catch (error) {
      logger.warn(`Failed to get channel info for ${channelId}:`, error);
      return { id: channelId, name: 'unknown-channel', isPrivate: false };
    }
  }

  /**
   * Replace user mentions with readable names
   */
  async replaceMentions(text) {
    const mentionPattern = /<@([U][A-Z0-9]+)>/g;
    let result = text;
    const matches = [...text.matchAll(mentionPattern)];

    for (const match of matches) {
      const userId = match[1];
      const user = await this.getUserInfo(userId);
      result = result.replace(match[0], `@${user.display_name || user.name}`);
    }

    return result;
  }

  /**
   * Replace channel mentions with readable names
   */
  async replaceChannelMentions(text) {
    const channelPattern = /<#([C][A-Z0-9]+)\|([^>]+)>/g;
    let result = text;
    const matches = [...text.matchAll(channelPattern)];

    for (const match of matches) {
      const channelName = match[2];
      result = result.replace(match[0], `#${channelName}`);
    }

    return result;
  }

  /**
   * Get file information from Slack
   */
  async getFileInfo(fileId) {
    try {
      const response = await this.client.files.info({
        file: fileId
      });
      
      return response.file;
    } catch (error) {
      logger.error(`❌ Failed to get Slack file info: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Download file content from Slack
   */
  async downloadFile(fileId) {
    try {
      const fileInfo = await this.getFileInfo(fileId);
      
      if (!fileInfo.url_private) {
        throw new Error('File URL not available');
      }

      // Download file content
      const response = await fetch(fileInfo.url_private, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      
      return {
        ...fileInfo,
        content: buffer
      };
    } catch (error) {
      logger.error(`❌ Failed to download Slack file: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Send message to Slack channel
   */
  async sendMessage(channelId, message) {
    try {
      const response = await this.client.chat.postMessage({
        channel: channelId,
        ...message
      });
      
      return response;
    } catch (error) {
      logger.error('❌ Failed to send Slack message:', error);
      throw error;
    }
  }

  /**
   * Send search results to Slack
   */
  async sendSearchResults(channelId, query, results) {
    try {
      const blocks = this.formatSearchResultsBlocks(query, results);
      
      await this.sendMessage(channelId, {
        text: `Search results for: "${query}"`,
        blocks
      });
    } catch (error) {
      logger.error('❌ Failed to send search results to Slack:', error);
      throw error;
    }
  }

  /**
   * Format search results as Slack blocks
   */
  formatSearchResultsBlocks(query, results) {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Search results for:* "${query}"`
        }
      },
      {
        type: 'divider'
      }
    ];

    results.slice(0, 5).forEach((result, index) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${index + 1}.* ${result.payload.text.substring(0, 200)}...`
        },
        fields: [
          {
            type: 'mrkdwn',
            text: `*Source:* ${result.payload.sourceType}`
          },
          {
            type: 'mrkdwn',
            text: `*Score:* ${(result.score * 100).toFixed(1)}%`
          }
        ]
      });
    });

    return blocks;
  }

  /**
   * Setup Slack Events API subscription
   */
  async setupEventsSubscription(config) {
    try {
      const { userId, teamId, channels, events } = config;
      
      logger.info(`✅ Setup Slack events subscription for team ${teamId}`);
      return {
        teamId,
        channels: channels || [],
        events: events || ['message', 'file_shared'],
        userId
      };
    } catch (error) {
      logger.error('❌ Failed to setup Slack events subscription:', error);
      throw error;
    }
  }

  /**
   * Health check method
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const channels = await this.getChannels();
      return {
        status: 'healthy',
        teamId: this.teamId,
        botUserId: this.botUserId,
        channelCount: channels.length,
        publicChannelCount: channels.filter(c => !c.isPrivate).length,
        memberChannelCount: channels.filter(c => c.isMember).length
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get service instance for specific user
   */
  static async getServiceForUser(userId) {
    const User = require('../models/mongodb/user.model');
    const user = await User.findById(userId);
    
    if (!user?.oauth?.slack?.token) {
      throw new Error('Slack not connected for user');
    }

    const service = new SlackService();
    await service.initializeClient(user.oauth.slack.token);
    return service;
  }
}

// Create and export a singleton instance
const slackService = new SlackService();
module.exports = slackService;
