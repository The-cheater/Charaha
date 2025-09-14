const { google } = require('googleapis');
const logger = require('../utils/logger');

class GoogleService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT
    );

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.docs = google.docs({ version: 'v1', auth: this.oauth2Client });
  }

  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/documents.readonly'
      ]
    });
  }

  async getGoogleUser(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token
      };
    } catch (error) {
      logger.error('Error getting Google user:', error);
      throw error;
    }
  }

  async setUserCredentials(accessToken, refreshToken) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }

  async getDocumentContent(documentId) {
    try {
      const response = await this.docs.documents.get({
        documentId
      });

      const doc = response.data;
      let text = '';

      if (doc.body && doc.body.content) {
        for (const element of doc.body.content) {
          if (element.paragraph) {
            for (const textElement of element.paragraph.elements) {
              if (textElement.textRun) {
                text += textElement.textRun.content;
              }
            }
          }
        }
      }

      return {
        title: doc.title,
        content: text,
        documentId,
        revisionId: doc.revisionId,
        lastModified: doc.documentStyle?.pageSize?.width ? new Date() : new Date()
      };
    } catch (error) {
      logger.error(`Error fetching document ${documentId}:`, error);
      throw error;
    }
  }

  async getFileMetadata(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,modifiedTime,owners,webViewLink,size'
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching file metadata ${fileId}:`, error);
      throw error;
    }
  }

  async getFilesInFolder(folderId, pageToken = null) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id,name,mimeType,modifiedTime)',
        pageToken
      });

      let files = response.data.files || [];

      // If there are more pages, recursively fetch them
      if (response.data.nextPageToken) {
        const nextPageFiles = await this.getFilesInFolder(folderId, response.data.nextPageToken);
        files = files.concat(nextPageFiles);
      }

      return files;
    } catch (error) {
      logger.error(`Error fetching files in folder ${folderId}:`, error);
      throw error;
    }
  }

  async exportDocument(fileId, mimeType = 'text/plain') {
    try {
      const response = await this.drive.files.export({
        fileId,
        mimeType
      });

      return response.data;
    } catch (error) {
      logger.error(`Error exporting document ${fileId}:`, error);
      throw error;
    }
  }

  async downloadFile(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      logger.error(`Error downloading file ${fileId}:`, error);
      throw error;
    }
  }
}

module.exports = new GoogleService();
