const { google } = require('googleapis');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

class GoogleDriveService {
  constructor() {
    try {
      // Initialize Google Auth
      this.auth = new google.auth.GoogleAuth({
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/documents.readonly',
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/presentations.readonly'
        ],
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
        }
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.docs = google.docs({ version: 'v1', auth: this.auth });
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.slides = google.slides({ version: 'v1', auth: this.auth });
      
      this.isConfigured = !!(process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_PRIVATE_KEY);
      
      if (this.isConfigured) {
        logger.info('✅ Google Drive Service initialized with real API');
      } else {
        logger.warn('⚠️ Google Drive Service initialized in MOCK mode - credentials not configured');
      }
    } catch (error) {
      logger.error('❌ Google Drive Service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if Google Drive API is properly configured
   */
  isApiConfigured() {
    return this.isConfigured;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    if (!this.isConfigured) {
      throw new Error('Google Drive API not configured');
    }

    try {
      const response = await this.drive.about.get({
        fields: 'user,storageQuota'
      });
      
      return {
        connected: true,
        user: response.data.user?.displayName,
        email: response.data.user?.emailAddress,
        quota: response.data.storageQuota
      };
    } catch (error) {
      logger.error('Google Drive connection test failed:', error);
      throw error;
    }
  }

  /**
   * Search for files in Google Drive
   */
  async searchFiles(query = '', folderId = null, pageSize = 50) {
    if (!this.isConfigured) {
      return this.getMockSearchResults(query, folderId);
    }

    try {
      let searchQuery = `trashed=false`;
      
      // Add folder filter if specified
      if (folderId) {
        searchQuery += ` and '${folderId}' in parents`;
      } else if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
        searchQuery += ` and '${process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID}' in parents`;
      }
      
      // Add text search if specified
      if (query) {
        searchQuery += ` and fullText contains '${query}'`;
      }

      // Add file type filters (documents, spreadsheets, presentations, PDFs)
      searchQuery += ` and (mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')`;

      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, owners, parents, webViewLink, webContentLink)',
        orderBy: 'modifiedTime desc'
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      logger.error('Google Drive search failed:', error);
      throw new Error(`Failed to search Google Drive: ${error.message}`);
    }
  }

  /**
   * Get all files from folder (with recursion support)
   */
  async getAllFilesFromFolder(folderId, recursive = false) {
    if (!this.isConfigured) {
      return this.getMockSearchResults('', folderId).files;
    }

    try {
      let allFiles = [];
      let nextPageToken = null;

      do {
        const response = await this.drive.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          pageSize: 100,
          pageToken: nextPageToken,
          fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, owners, parents, webViewLink)',
          orderBy: 'modifiedTime desc'
        });

        const files = response.data.files || [];
        
        for (const file of files) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            // If recursive, get files from subfolder
            if (recursive) {
              const subFiles = await this.getAllFilesFromFolder(file.id, recursive);
              allFiles.push(...subFiles);
            }
          } else {
            // Add non-folder files
            allFiles.push(file);
          }
        }

        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      return allFiles;
    } catch (error) {
      logger.error('Failed to get all files from folder:', error);
      throw error;
    }
  }

  /**
   * Get folder structure
   */
  async getFolders(parentId = null) {
    if (!this.isConfigured) {
      return this.getMockFolders();
    }

    try {
      let query = `mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      } else if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
        query += ` and '${process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID}' in parents`;
      } else {
        query += ` and 'root' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, parents, createdTime, modifiedTime)',
        orderBy: 'name'
      });

      return response.data.files || [];
    } catch (error) {
      logger.error('Failed to get folders:', error);
      throw error;
    }
  }

  /**
   * Extract text content from different file types
   */
  async extractTextContent(fileId, mimeType) {
    if (!this.isConfigured) {
      return `Mock text content for file ${fileId} of type ${mimeType}. This is sample content that would be extracted from a real Google Drive document. It contains keywords like meeting, project, and important information.`;
    }

    try {
      switch (mimeType) {
        case 'application/vnd.google-apps.document':
          return await this.extractGoogleDocsText(fileId);
          
        case 'application/vnd.google-apps.spreadsheet':
          return await this.extractGoogleSheetsText(fileId);
          
        case 'application/vnd.google-apps.presentation':
          return await this.extractGoogleSlidesText(fileId);
          
        case 'application/pdf':
          return await this.extractPDFText(fileId);
          
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractWordText(fileId);
          
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      logger.error(`Failed to extract text from file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Extract text from Google Docs
   */
  async extractGoogleDocsText(docId) {
    try {
      const response = await this.docs.documents.get({
        documentId: docId
      });

      let text = '';
      const content = response.data.body?.content || [];

      const extractTextFromElements = (elements) => {
        elements.forEach(element => {
          if (element.paragraph) {
            element.paragraph.elements?.forEach(elem => {
              if (elem.textRun) {
                text += elem.textRun.content || '';
              }
            });
          } else if (element.table) {
            element.table.tableRows?.forEach(row => {
              row.tableCells?.forEach(cell => {
                if (cell.content) {
                  extractTextFromElements(cell.content);
                }
              });
            });
          }
        });
      };

      extractTextFromElements(content);
      return text.trim();
    } catch (error) {
      logger.error(`Failed to extract Google Docs text:`, error);
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

      let text = '';
      const sheets = response.data.sheets || [];

      sheets.forEach(sheet => {
        const title = sheet.properties?.title || '';
        text += `Sheet: ${title}\n`;

        const gridData = sheet.data?.[0]?.rowData || [];
        gridData.forEach(row => {
          const values = row.values || [];
          const rowText = values
            .map(cell => cell.formattedValue || '')
            .filter(value => value.trim())
            .join(' | ');
          
          if (rowText) {
            text += rowText + '\n';
          }
        });
      });

      return text.trim();
    } catch (error) {
      logger.error(`Failed to extract Google Sheets text:`, error);
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

      let text = '';
      const slides = response.data.slides || [];

      slides.forEach((slide, index) => {
        text += `Slide ${index + 1}:\n`;
        
        const pageElements = slide.pageElements || [];
        pageElements.forEach(element => {
          if (element.shape?.text?.textElements) {
            element.shape.text.textElements.forEach(textElement => {
              if (textElement.textRun) {
                text += textElement.textRun.content || '';
              }
            });
          }
        });
        
        text += '\n\n';
      });

      return text.trim();
    } catch (error) {
      logger.error(`Failed to extract Google Slides text:`, error);
      throw error;
    }
  }

  // Extract text from PDF files
async extractPDFText(fileId) {
  try {
    const response = await this.drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' }); // Add responseType
    
    const buffer = Buffer.from(response.data);
    const pdfData = await pdfParse(buffer);
    return pdfData.text;
  } catch (error) {
    logger.error('Failed to extract PDF text:', error);
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
      });

      const buffer = Buffer.from(response.data);
      const result = await mammoth.extractRawText({ buffer });
      
      return result.value;
    } catch (error) {
      logger.error(`Failed to extract Word text:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(fileId) {
    if (!this.isConfigured) {
      return {
        id: fileId,
        name: `Mock File ${fileId}`,
        mimeType: 'application/vnd.google-apps.document',
        webViewLink: `https://docs.google.com/document/d/${fileId}`,
        size: '15420',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      };
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, owners, parents, webViewLink, webContentLink'
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to get file info for ${fileId}:`, error);
      throw error;
    }
  }

  // Mock data methods (fallback when API not configured)
  getMockFolders() {
    return [
      {
        id: 'mock-folder-1',
        name: '📄 Team Documents',
        parents: ['root'],
        createdTime: new Date('2025-01-01').toISOString(),
        modifiedTime: new Date().toISOString()
      },
      {
        id: 'mock-folder-2',
        name: '🚀 Projects',
        parents: ['root'],
        createdTime: new Date('2025-01-15').toISOString(),
        modifiedTime: new Date().toISOString()
      }
    ];
  }

  getMockSearchResults(query, folderId) {
    return {
      files: [
        {
          id: 'mock-doc-1',
          name: `${query || 'Sample'} Document.docx`,
          mimeType: 'application/vnd.google-apps.document',
          size: '15420',
          webViewLink: 'https://docs.google.com/document/d/mock-doc-1',
          owners: [{ displayName: 'Mock User', emailAddress: 'mock@example.com' }],
          createdTime: new Date().toISOString(),
          modifiedTime: new Date().toISOString()
        }
      ],
      nextPageToken: null
    };
  }
}

module.exports = GoogleDriveService;
