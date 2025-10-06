const { google } = require('googleapis');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');
const { GOOGLE_DRIVE_CONFIG } = require('../utils/constants');

class GoogleDriveService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT
    );
    
    this.isInitialized = false;
    this.userTokens = null;
  }

  /**
   * Initialize authenticated Google Drive client
   */
  async initializeClient(tokens) {
    try {
      this.oauth2Client.setCredentials(tokens);
      this.userTokens = tokens;
      
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      this.docs = google.docs({ version: 'v1', auth: this.oauth2Client });
      this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
      this.slides = google.slides({ version: 'v1', auth: this.oauth2Client });
      
      this.isInitialized = true;
      logger.info('✅ Google Drive client initialized for user');
    } catch (error) {
      logger.error('❌ Failed to initialize Google Drive client:', error);
      throw error;
    }
  }

  /**
   * Test connection to Google Drive
   */
  async testConnection() {
    try {
      const response = await this.drive.about.get({
        fields: 'user,storageQuota'
      });
      
      return {
        connected: true,
        user: response.data.user?.displayName,
        email: response.data.user?.emailAddress,
        quotaUsed: this.formatBytes(response.data.storageQuota?.usage),
        quotaTotal: this.formatBytes(response.data.storageQuota?.limit)
      };
    } catch (error) {
      logger.error('❌ Google Drive connection test failed:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Search files in Google Drive with advanced filtering
   */
  async searchFiles(params = {}) {
    try {
      const query = this.buildSearchQuery(params);
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,owners,parents,thumbnailLink,exportLinks)',
        pageSize: params.pageSize || 50,
        orderBy: params.orderBy || 'modifiedTime desc',
        pageToken: params.pageToken
      });

      const files = response.data.files || [];
      logger.info(`📂 Found ${files.length} files in Google Drive`);
      
      return {
        files: files.map(this.formatFileMetadata),
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      logger.error('❌ Google Drive search failed:', error);
      throw new Error(`Google Drive search failed: ${error.message}`);
    }
  }

  /**
   * Get detailed file information
   */
  async getFileDetails(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,owners,parents,permissions,thumbnailLink,exportLinks'
      });

      return this.formatFileMetadata(response.data);
    } catch (error) {
      logger.error(`❌ Failed to get file details for ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Extract content from various file types
   */
  async extractFileContent(fileId, mimeType) {
    try {
      let content = '';

      if (mimeType.includes('document')) {
        // Google Docs
        content = await this.extractGoogleDocsText(fileId);
      } else if (mimeType.includes('spreadsheet')) {
        // Google Sheets
        content = await this.extractGoogleSheetsText(fileId);
      } else if (mimeType.includes('presentation')) {
        // Google Slides
        content = await this.extractGoogleSlidesText(fileId);
      } else if (mimeType === 'text/plain') {
        // Plain text files
        const response = await this.drive.files.get({
          fileId,
          alt: 'media'
        });
        content = response.data;
      } else if (mimeType === 'application/pdf') {
        // PDF files
        content = await this.extractPDFText(fileId);
      } else if (mimeType.includes('wordprocessingml.document')) {
        // Word documents
        content = await this.extractWordText(fileId);
      } else {
        // Try to export as plain text
        try {
          const response = await this.drive.files.export({
            fileId,
            mimeType: 'text/plain'
          });
          content = response.data;
        } catch (exportError) {
          logger.warn(`⚠️ Cannot extract content from ${mimeType}`);
          content = `Content extraction not supported for ${mimeType}`;
        }
      }

      return {
        content: content.trim(),
        wordCount: content.split(/\s+/).length,
        charCount: content.length
      };
    } catch (error) {
      logger.error(`❌ Content extraction failed for ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Extract text from Google Docs
   */
  async extractGoogleDocsText(docId) {
    try {
      const doc = await this.docs.documents.get({ documentId: docId });
      return this.extractTextFromGoogleDoc(doc.data);
    } catch (error) {
      logger.error(`❌ Failed to extract Google Docs text:`, error);
      throw error;
    }
  }

  /**
   * Extract text from Google Sheets
   */
  async extractGoogleSheetsText(sheetId) {
    try {
      const response = await this.sheets.spreadsheets.get({ 
        spreadsheetId: sheetId,
        includeGridData: true
      });
      return this.extractTextFromGoogleSheet(response.data);
    } catch (error) {
      logger.error(`❌ Failed to extract Google Sheets text:`, error);
      throw error;
    }
  }

  /**
   * Extract text from Google Slides
   */
  async extractGoogleSlidesText(presentationId) {
    try {
      const response = await this.slides.presentations.get({ 
        presentationId: presentationId 
      });
      return this.extractTextFromGoogleSlides(response.data);
    } catch (error) {
      logger.error(`❌ Failed to extract Google Slides text:`, error);
      throw error;
    }
  }

  /**
   * Extract text from PDF files
   */
  async extractPDFText(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'arraybuffer' });

      const buffer = Buffer.from(response.data);
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    } catch (error) {
      logger.error('❌ Failed to extract PDF text:', error);
      throw error;
    }
  }

  /**
   * Extract text from Word documents
   */
  async extractWordText(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'arraybuffer' });

      const buffer = Buffer.from(response.data);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error(`❌ Failed to extract Word text:`, error);
      throw error;
    }
  }

  /**
   * Get folders for navigation
   */
  async getFolders(parentId = null) {
    try {
      let query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      } else {
        query += " and 'root' in parents";
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id,name,parents,createdTime,modifiedTime)',
        orderBy: 'name'
      });

      return response.data.files || [];
    } catch (error) {
      logger.error('❌ Failed to get folders:', error);
      throw error;
    }
  }

  /**
   * Setup push notifications for Drive changes
   */
  async setupPushNotifications(config) {
    try {
      const { userId, folders, webhookUrl } = config;
      
      const channelId = `drive_${userId}_${Date.now()}`;
      const channelToken = process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN;
      
      const requestBody = {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        token: channelToken,
        expiration: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      let resource;
      if (folders && folders.length > 0) {
        // Watch specific folders
        const subscriptions = [];
        for (const folderId of folders) {
          const response = await this.drive.files.watch({
            fileId: folderId,
            requestBody
          });
          subscriptions.push(response.data);
        }
        resource = subscriptions[0];
      } else {
        // Watch entire drive
        const response = await this.drive.changes.watch({
          pageToken: await this.getStartPageToken(),
          requestBody
        });
        resource = response.data;
      }

      logger.info(`✅ Setup Drive push notifications: ${channelId}`);
      return {
        id: channelId,
        resourceId: resource.resourceId,
        expiration: resource.expiration
      };
    } catch (error) {
      logger.error('❌ Failed to setup Drive push notifications:', error);
      throw error;
    }
  }

  /**
   * Stop push notifications
   */
  async stopPushNotifications(channelId, resourceId) {
    try {
      await this.drive.channels.stop({
        requestBody: {
          id: channelId,
          resourceId: resourceId
        }
      });
      
      logger.info(`✅ Stopped Drive push notifications: ${channelId}`);
    } catch (error) {
      logger.error('❌ Failed to stop Drive push notifications:', error);
      throw error;
    }
  }

  /**
   * Get changes since last sync
   */
  async getChanges(pageToken) {
    try {
      const response = await this.drive.changes.list({
        pageToken,
        includeRemoved: true,
        fields: 'changes(file(id,name,mimeType,modifiedTime,trashed),removed),newStartPageToken'
      });

      return {
        files: response.data.changes || [],
        newStartPageToken: response.data.newStartPageToken
      };
    } catch (error) {
      logger.error('❌ Failed to get Drive changes:', error);
      throw error;
    }
  }

  /**
   * Get start page token for changes
   */
  async getStartPageToken() {
    try {
      const response = await this.drive.changes.getStartPageToken();
      return response.data.startPageToken;
    } catch (error) {
      logger.error('❌ Failed to get start page token:', error);
      throw error;
    }
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
   * Build search query from parameters
   */
  buildSearchQuery(params) {
    let query = "trashed=false";

    if (params.query) {
      query += ` and fullText contains '${params.query}'`;
    }

    if (params.mimeType) {
      query += ` and mimeType='${params.mimeType}'`;
    }

    if (params.folder) {
      query += ` and '${params.folder}' in parents`;
    }

    if (params.owner) {
      query += ` and '${params.owner}' in owners`;
    }

    if (params.modifiedAfter) {
      query += ` and modifiedTime > '${params.modifiedAfter}'`;
    }

    return query;
  }

  /**
   * Format file metadata for consistent API response
   */
  formatFileMetadata(file) {
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      owners: file.owners,
      parents: file.parents,
      thumbnailLink: file.thumbnailLink,
      exportLinks: file.exportLinks
    };
  }

  /**
   * Extract text from Google Docs
   */
  extractTextFromGoogleDoc(doc) {
    let text = '';
    
    if (doc.body?.content) {
      for (const element of doc.body.content) {
        if (element.paragraph?.elements) {
          for (const textElement of element.paragraph.elements) {
            if (textElement.textRun?.content) {
              text += textElement.textRun.content;
            }
          }
        }
        if (element.table) {
          for (const row of element.table.tableRows || []) {
            for (const cell of row.tableCells || []) {
              if (cell.content) {
                for (const cellElement of cell.content) {
                  if (cellElement.paragraph?.elements) {
                    for (const textElement of cellElement.paragraph.elements) {
                      if (textElement.textRun?.content) {
                        text += textElement.textRun.content;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return text;
  }

  /**
   * Extract text from Google Sheets
   */
  extractTextFromGoogleSheet(sheet) {
    let text = '';
    
    if (sheet.sheets) {
      for (const sheetTab of sheet.sheets) {
        text += `Sheet: ${sheetTab.properties?.title}\n`;
        if (sheetTab.data?.[0]?.rowData) {
          for (const row of sheetTab.data[0].rowData) {
            if (row.values) {
              const rowText = row.values
                .map(cell => cell.formattedValue || '')
                .join('\t');
              if (rowText.trim()) {
                text += rowText + '\n';
              }
            }
          }
        }
      }
    }

    return text;
  }

  /**
   * Extract text from Google Slides
   */
  extractTextFromGoogleSlides(presentation) {
    let text = '';
    
    if (presentation.slides) {
      for (const [index, slide] of presentation.slides.entries()) {
        text += `Slide ${index + 1}:\n`;
        if (slide.pageElements) {
          for (const element of slide.pageElements) {
            if (element.shape?.text?.textElements) {
              for (const textElement of element.shape.text.textElements) {
                if (textElement.textRun?.content) {
                  text += textElement.textRun.content;
                }
              }
            }
          }
        }
        text += '\n\n';
      }
    }

    return text;
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
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get service instance for specific user
   */
  static async getServiceForUser(userId) {
    const User = require('../models/mongodb/user.model');
    const user = await User.findById(userId);
    
    if (!user?.oauth?.google?.tokens) {
      throw new Error('Google Drive not connected for user');
    }

    const service = new GoogleDriveService();
    await service.initializeClient(user.oauth.google.tokens);
    return service;
  }
}

module.exports = GoogleDriveService;
