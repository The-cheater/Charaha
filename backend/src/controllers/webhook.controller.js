const crypto = require('crypto');
const slackService = require('../services/slack.service');
const googleDriveService = require('../services/google-drive.service');
const webhookService = require('../services/webhook.service');
const ingestService = require('../services/ingest.service');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/helpers');

class WebhookController {
  /**
   * Handle Slack Events API webhook
   */
  async handleSlackEvent(req, res) {
    try {
      const { type, challenge, event, team_id } = req.body;

      // URL verification challenge
      if (type === 'url_verification') {
        logger.info('🔗 Slack URL verification challenge received');
        return res.json({ challenge });
      }

      // Handle event callbacks
      if (type === 'event_callback') {
        logger.info(`📨 Slack event received: ${event.type}`);

        // Process event asynchronously to respond quickly
        setImmediate(async () => {
          try {
            await this.processSlackEvent(event, team_id);
          } catch (error) {
            logger.error('❌ Failed to process Slack event:', error);
          }
        });

        return successResponse(res, 'Event received');
      }

      return successResponse(res, 'Webhook processed');
    } catch (error) {
      logger.error('❌ Slack webhook error:', error);
      return errorResponse(res, 'Webhook processing failed', 500);
    }
  }

  /**
   * Handle Slack Interactive Components (buttons, modals, etc.)
   */
  async handleSlackInteraction(req, res) {
    try {
      const payload = JSON.parse(req.body.payload);
      logger.info(`🎛️ Slack interaction: ${payload.type}`);

      switch (payload.type) {
        case 'block_actions':
          await this.handleSlackBlockActions(payload);
          break;
        case 'shortcut':
          await this.handleSlackShortcut(payload);
          break;
        case 'view_submission':
          await this.handleSlackModalSubmission(payload);
          break;
        default:
          logger.warn(`⚠️ Unknown Slack interaction type: ${payload.type}`);
      }

      return successResponse(res, 'Interaction processed');
    } catch (error) {
      logger.error('❌ Slack interaction error:', error);
      return errorResponse(res, 'Interaction processing failed', 500);
    }
  }

  /**
   * Handle Google Drive push notifications
   */
  async handleDriveChange(req, res) {
    try {
      const { resourceId, resourceUri, eventType } = req.headers;
      
      if (!resourceId) {
        return errorResponse(res, 'Missing resource ID', 400);
      }

      logger.info(`📂 Google Drive change notification: ${eventType}`);

      // Process Drive change asynchronously
      setImmediate(async () => {
        try {
          await this.processDriveChange({
            resourceId,
            resourceUri,
            eventType,
            channelId: req.headers['x-goog-channel-id'],
            channelToken: req.headers['x-goog-channel-token']
          });
        } catch (error) {
          logger.error('❌ Failed to process Drive change:', error);
        }
      });

      return successResponse(res, 'Drive change notification received');
    } catch (error) {
      logger.error('❌ Drive webhook error:', error);
      return errorResponse(res, 'Drive webhook processing failed', 500);
    }
  }

  /**
   * Handle GitHub webhooks (for future integration)
   */
  async handleGitHubWebhook(req, res) {
    try {
      const event = req.headers['x-github-event'];
      const signature = req.headers['x-hub-signature-256'];
      
      // Verify GitHub webhook signature
      if (!this.verifyGitHubSignature(req.body, signature)) {
        return errorResponse(res, 'Invalid signature', 401);
      }

      logger.info(`🐙 GitHub webhook: ${event}`);

      // Process GitHub events asynchronously
      setImmediate(async () => {
        try {
          await this.processGitHubEvent(event, req.body);
        } catch (error) {
          logger.error('❌ Failed to process GitHub event:', error);
        }
      });

      return successResponse(res, 'GitHub webhook processed');
    } catch (error) {
      logger.error('❌ GitHub webhook error:', error);
      return errorResponse(res, 'GitHub webhook processing failed', 500);
    }
  }

  /**
   * Process individual Slack events
   */
  async processSlackEvent(event, teamId) {
    switch (event.type) {
      case 'message':
        await this.handleSlackMessage(event, teamId);
        break;
      case 'file_shared':
        await this.handleSlackFileShared(event, teamId);
        break;
      case 'channel_created':
        await this.handleSlackChannelCreated(event, teamId);
        break;
      case 'member_joined_channel':
        await this.handleSlackMemberJoined(event, teamId);
        break;
      default:
        logger.debug(`🔍 Unhandled Slack event: ${event.type}`);
    }
  }

  /**
   * Handle new Slack messages
   */
  async handleSlackMessage(event, teamId) {
    // Skip bot messages and message edits
    if (event.subtype || event.bot_id) return;

    try {
      // Get workspace info
      const workspace = await webhookService.getWorkspaceByTeamId(teamId);
      if (!workspace) {
        logger.warn(`⚠️ Unknown workspace: ${teamId}`);
        return;
      }

      // Check if auto-ingestion is enabled for this channel
      const shouldIngest = await webhookService.shouldIngestChannel(
        workspace.userId, 
        event.channel
      );

      if (shouldIngest) {
        // Format message for ingestion
        const messageData = {
          id: `${event.channel}_${event.ts}`,
          text: event.text,
          user: event.user,
          channel: event.channel,
          timestamp: event.ts,
          thread_ts: event.thread_ts,
          workspace: teamId
        };

        // Auto-ingest the message
        await ingestService.ingestSlackMessage(workspace.userId, messageData);
        logger.info(`📝 Auto-ingested Slack message from channel ${event.channel}`);
      }
    } catch (error) {
      logger.error('❌ Failed to process Slack message:', error);
    }
  }

  /**
   * Handle Slack file shares
   */
  async handleSlackFileShared(event, teamId) {
    try {
      const workspace = await webhookService.getWorkspaceByTeamId(teamId);
      if (!workspace) return;

      const shouldIngest = await webhookService.shouldIngestFiles(workspace.userId);
      
      if (shouldIngest) {
        // Get file details from Slack
        const fileDetails = await slackService.getFileInfo(event.file_id);
        
        // Auto-ingest the file
        await ingestService.ingestSlackFile(workspace.userId, fileDetails);
        logger.info(`📄 Auto-ingested Slack file: ${fileDetails.name}`);
      }
    } catch (error) {
      logger.error('❌ Failed to process Slack file:', error);
    }
  }

  /**
   * Handle Slack block actions (button clicks, etc.)
   */
  async handleSlackBlockActions(payload) {
    for (const action of payload.actions) {
      switch (action.action_id) {
        case 'ingest_channel':
          await this.handleIngestChannelAction(payload, action);
          break;
        case 'search_knowledge':
          await this.handleSearchAction(payload, action);
          break;
        default:
          logger.debug(`🔍 Unknown block action: ${action.action_id}`);
      }
    }
  }

  /**
   * Process Google Drive changes
   */
  async processDriveChange(changeData) {
    try {
      // Get the webhook subscription details
      const subscription = await webhookService.getDriveSubscription(
        changeData.channelId
      );
      
      if (!subscription) {
        logger.warn(`⚠️ Unknown Drive subscription: ${changeData.channelId}`);
        return;
      }

      // Check if auto-ingestion is enabled
      const shouldIngest = await webhookService.shouldIngestDriveChanges(
        subscription.userId
      );

      if (shouldIngest) {
        // Get the specific changes
        const changes = await googleDriveService.getChanges(
          subscription.userId,
          subscription.pageToken
        );

        // Process each change
        for (const change of changes.files || []) {
          if (change.removed) {
            // Handle file deletion
            await webhookService.handleFileDeleted(subscription.userId, change.fileId);
          } else {
            // Handle file creation/modification
            await this.handleDriveFileChange(subscription.userId, change);
          }
        }

        // Update page token for next changes
        await webhookService.updateDrivePageToken(
          changeData.channelId,
          changes.newStartPageToken
        );
      }
    } catch (error) {
      logger.error('❌ Failed to process Drive change:', error);
    }
  }

  /**
   * Handle individual Drive file changes
   */
  async handleDriveFileChange(userId, change) {
    try {
      // Get file details
      const fileDetails = await googleDriveService.getFileDetails(
        userId,
        change.fileId
      );

      // Check if file type should be ingested
      const shouldIngest = await webhookService.shouldIngestFileType(
        userId,
        fileDetails.mimeType
      );

      if (shouldIngest) {
        // Auto-ingest the file
        await ingestService.ingestGoogleDriveFile(userId, fileDetails);
        logger.info(`📂 Auto-ingested Drive file: ${fileDetails.name}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to process Drive file change: ${change.fileId}`, error);
    }
  }

  /**
   * Process GitHub events
   */
  async processGitHubEvent(event, payload) {
    switch (event) {
      case 'push':
        await this.handleGitHubPush(payload);
        break;
      case 'pull_request':
        await this.handleGitHubPullRequest(payload);
        break;
      case 'issues':
        await this.handleGitHubIssue(payload);
        break;
      default:
        logger.debug(`🔍 Unhandled GitHub event: ${event}`);
    }
  }

  /**
   * Verify GitHub webhook signature
   */
  verifyGitHubSignature(payload, signature) {
    if (!process.env.GITHUB_WEBHOOK_SECRET) return true; // Skip if no secret

    const expectedSignature = crypto
      .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  /**
   * Handle channel created events
   */
  async handleSlackChannelCreated(event, teamId) {
    logger.info(`🆕 New Slack channel created: ${event.channel.name}`);
    // Could auto-enable ingestion for new channels based on patterns
  }

  /**
   * Handle member joined channel events
   */
  async handleSlackMemberJoined(event, teamId) {
    logger.info(`👋 Member ${event.user} joined channel ${event.channel}`);
    // Could send welcome messages or setup instructions
  }
}

module.exports = new WebhookController();
