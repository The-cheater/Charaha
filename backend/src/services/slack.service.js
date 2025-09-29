const { WebClient } = require('@slack/web-api');
const crypto = require('crypto');
const logger = require('../utils/logger');
const vectorService = require('./vector.service');

class SlackService {
  constructor() {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.isInitialized = false;
    this.userCache = new Map();
    this.channelCache = new Map();
  }

  async initialize() {
    try {
      const auth = await this.client.auth.test();
      this.botUserId = auth.user_id;
      this.teamId = auth.team_id;
      this.teamDomain = auth.url.replace('https://', '').replace('.slack.com/', '');
      this.isInitialized = true;
      logger.info(`✅ Slack service initialized for team: ${auth.team}`);
      return true;
    } catch (error) {
      logger.error('Slack initialization failed:', error);
      throw error;
    }
  }

  // Auto-join a specific channel
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
        return true; // Not an error, just a limitation
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

  // Auto-join all public channels
  async autoJoinAllChannels() {
    try {
      const channels = await this.getChannels();
      const publicChannels = channels.filter(c => !c.isPrivate);
      
      logger.info(`Attempting to join ${publicChannels.length} public channels...`);
      
      const results = {
        attempted: publicChannels.length,
        joined: 0,
        alreadyIn: 0,
        failed: 0
      };
      
      for (const channel of publicChannels) {
        const success = await this.joinChannel(channel.id);
        if (success) {
          results.joined++;
        } else {
          results.failed++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      logger.info(`✅ Channel join results: ${results.joined} joined, ${results.failed} failed`);
      return results;
    } catch (error) {
      logger.error('Auto-join channels failed:', error);
      throw error;
    }
  }

  // Get all channels
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
      logger.error('Failed to get channels:', error);
      throw error;
    }
  }

  // Get messages from a channel
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

  // Format message for vector storage
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
      logger.error('Failed to format message:', error);
      throw error;
    }
  }

  // Get user info (with caching)
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

  // Get channel info (with caching)
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

  // Replace user mentions with readable names
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

  // Replace channel mentions with readable names
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

  // Ingest channel messages into vector database
  async ingestChannel(channelId, options = {}) {
    try {
      logger.info(`Starting ingestion for channel: ${channelId}`);
      
      // Try to join channel first
      await this.joinChannel(channelId);
      
      const messages = await this.getChannelMessages(channelId, options);
      
      if (messages.length === 0) {
        logger.info(`No messages to ingest from channel ${channelId}`);
        return { channelId, processed: 0, stored: 0 };
      }

      // Store messages in vector database with delays
      let stored = 0;
      const errors = [];
      
      for (const message of messages) {
        try {
          await vectorService.storeVector(message.id, message.text, message.metadata);
          stored++;
          
          if (stored % 10 === 0) {
            logger.info(`Progress: ${stored}/${messages.length} messages stored`);
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.error(`Failed to store message ${message.id}:`, error.message);
          errors.push({
            messageId: message.id,
            error: error.message
          });
        }
      }
      
      logger.info(`✅ Ingested ${stored}/${messages.length} messages from channel ${channelId}`);
      
      return {
        channelId,
        processed: messages.length,
        stored: stored,
        failed: errors.length,
        errors: errors.slice(0, 5) // Only return first 5 errors
      };
    } catch (error) {
      logger.error(`Channel ingestion failed for ${channelId}:`, error);
      throw error;
    }
  }

  // Bulk ingest multiple channels
  async bulkIngestChannels(channelIds, options = {}) {
    try {
      logger.info(`Starting bulk ingestion for ${channelIds.length} channels`);
      
      const results = [];
      let totalStored = 0;
      
      for (const channelId of channelIds) {
        try {
          logger.info(`Processing channel ${channelId}...`);
          const result = await this.ingestChannel(channelId, options);
          results.push(result);
          totalStored += result.stored;
          
          // Delay between channels to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          logger.error(`Failed to ingest channel ${channelId}:`, error);
          results.push({
            channelId,
            processed: 0,
            stored: 0,
            failed: 1,
            error: error.message
          });
        }
      }
      
      logger.info(`✅ Bulk ingestion completed: ${totalStored} total messages stored`);
      
      return {
        channels: results,
        totalStored,
        totalProcessed: results.reduce((sum, r) => sum + (r.processed || 0), 0),
        totalFailed: results.reduce((sum, r) => sum + (r.failed || 0), 0)
      };
    } catch (error) {
      logger.error('Bulk ingestion failed:', error);
      throw error;
    }
  }

  // Search messages (using existing vector search)
  async searchMessages(query, options = {}) {
    try {
      const {
        limit = 10,
        channelId = null,
        userId = null,
        startDate = null,
        endDate = null
      } = options;

      const filters = { source: 'slack' };
      if (channelId) filters.channelId = channelId;
      if (userId) filters.userId = userId;

      const results = await vectorService.searchSimilar(query, limit, filters);
      
      // Filter by date if provided
      let filteredResults = results;
      if (startDate || endDate) {
        filteredResults = results.filter(result => {
          const messageDate = new Date(result.metadata.timestamp);
          if (startDate && messageDate < new Date(startDate)) return false;
          if (endDate && messageDate > new Date(endDate)) return false;
          return true;
        });
      }

      return filteredResults.map(result => ({
        ...result,
        url: result.metadata.permalink,
        channel: result.metadata.channelName,
        user: result.metadata.userName,
        timestamp: result.metadata.timestamp
      }));
    } catch (error) {
      logger.error('Slack search failed:', error);
      throw error;
    }
  }

  // Get channel membership status
  async getChannelMembership(channelId) {
    try {
      const response = await this.client.conversations.members({
        channel: channelId,
        limit: 1
      });
      
      return {
        isMember: true,
        memberCount: response.members?.length || 0
      };
    } catch (error) {
      if (error.data?.error === 'not_in_channel') {
        return { isMember: false, memberCount: 0 };
      }
      throw error;
    }
  }

  // Health check method
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
}

module.exports = new SlackService();
