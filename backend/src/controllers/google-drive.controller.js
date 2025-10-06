const GoogleDriveService = require('../services/google-drive.service');
const vectorService = require('../services/vector.service');
const documentProcessor = require('../utils/document-processor');
const logger = require('../utils/logger');

class GoogleDriveController {
  constructor() {
    this.driveService = new GoogleDriveService();
    this.vectorService = vectorService;
  }

  /**
   * Get Google Drive folders
   */
  getFolders = async (req, res) => {
    try {
      const { parentId } = req.query;
      
      const folders = await this.driveService.getFolders(parentId);
      
      res.json({
        status: 'success',
        data: { 
          folders,
          mode: this.driveService.isApiConfigured() ? 'real' : 'mock'
        }
      });
    } catch (error) {
      logger.error('Get folders failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };

  /**
   * Search Google Drive files
   */
  searchFiles = async (req, res) => {
    try {
      const { query, folderId, pageSize = 20 } = req.query;
      
      const result = await this.driveService.searchFiles(query, folderId, parseInt(pageSize));
      
      res.json({
        status: 'success',
        data: {
          ...result,
          mode: this.driveService.isApiConfigured() ? 'real' : 'mock'
        }
      });
    } catch (error) {
      logger.error('Search files failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };

  /**
   * Ingest Google Drive files into vector database
   */
  ingestFiles = async (req, res) => {
    try {
      const { fileIds, folderId } = req.body;
      
      if (!fileIds || !Array.isArray(fileIds)) {
        return res.status(400).json({
          status: 'error',
          message: 'File IDs array is required'
        });
      }

      const results = {
        processed: 0,
        stored: 0,
        failed: 0,
        errors: []
      };

      for (const fileId of fileIds) {
        try {
          results.processed++;

          // Get file metadata
          const fileInfo = await this.driveService.getFileInfo(fileId);
          
          // Extract text content
          const textContent = await this.driveService.extractTextContent(fileId, fileInfo.mimeType);
          
          if (!textContent || textContent.trim().length === 0) {
            results.failed++;
            results.errors.push(`No text content found in file: ${fileInfo.name}`);
            continue;
          }

          // Process text content
          const processedContent = documentProcessor.processText(textContent);

          // Create vector embedding and store
          await this.vectorService.storeVector(fileId, processedContent, {
            source: 'google-drive',
            fileId: fileInfo.id,
            fileName: fileInfo.name,
            mimeType: fileInfo.mimeType,
            size: fileInfo.size,
            createdTime: fileInfo.createdTime,
            modifiedTime: fileInfo.modifiedTime,
            webViewLink: fileInfo.webViewLink,
            owners: fileInfo.owners || [],
            parents: fileInfo.parents || [],
            originalLength: textContent.length,
            processedLength: processedContent.length,
            ingestedAt: new Date().toISOString(),
            ingestedBy: req.user?.id
          });

          results.stored++;
          logger.info(`Successfully ingested Google Drive file: ${fileInfo.name}`);

        } catch (fileError) {
          results.failed++;
          results.errors.push(`Failed to process file ${fileId}: ${fileError.message}`);
          logger.error(`Failed to ingest file ${fileId}:`, fileError);
        }
      }

      res.json({
        status: 'success',
        data: results
      });

    } catch (error) {
      logger.error('Ingest files failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };

  /**
   * Get file content preview
   */
  getFilePreview = async (req, res) => {
    try {
      const { fileId } = req.params;
      
      const fileInfo = await this.driveService.getFileInfo(fileId);
      const textContent = await this.driveService.extractTextContent(fileId, fileInfo.mimeType);
      
      // Return first 500 characters as preview
      const preview = textContent.substring(0, 500) + (textContent.length > 500 ? '...' : '');
      
      res.json({
        status: 'success',
        data: {
          fileInfo,
          preview,
          fullLength: textContent.length,
          mode: this.driveService.isApiConfigured() ? 'real' : 'mock'
        }
      });
    } catch (error) {
      logger.error('Get file preview failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };
}

module.exports = new GoogleDriveController();
