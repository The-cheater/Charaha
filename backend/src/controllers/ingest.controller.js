const slackService = require('../services/slack.service');
const GoogleDriveService = require('../services/google-drive.service');
const VectorService = require('../services/vector.service');

class IngestController {
  constructor() {
    this.slackService = slackService; // Use imported instance
    this.googleDriveService = new GoogleDriveService();
    this.vectorService = new VectorService();
  }

  /**
   * Ingest Slack messages
   */
  ingestSlackMessages = async (req, res) => {
    try {
      const { channelId, limit = 100 } = req.body;

      if (!channelId) {
        return res.status(400).json({
          status: 'error',
          message: 'Channel ID is required'
        });
      }

      const messages = await this.slackService.getChannelMessages(channelId, limit);
      
      const results = {
        processed: 0,
        stored: 0,
        failed: 0,
        errors: []
      };

      for (const message of messages) {
        try {
          results.processed++;

          if (!message.text || message.text.trim().length === 0) {
            continue;
          }

          // Process and store message
          const processedContent = documentProcessor.processText(message.text);
          
          await this.vectorService.storeVector(message.ts, processedContent, {
            source: 'slack',
            channelId: message.channel,
            userId: message.user,
            timestamp: message.ts,
            messageType: message.type || 'message',
            threadTs: message.thread_ts,
            originalText: message.text
          });

          results.stored++;

        } catch (error) {
          results.failed++;
          results.errors.push(`Message ${message.ts}: ${error.message}`);
          logger.error(`Failed to process message ${message.ts}:`, error);
        }
      }

      res.json({
        status: 'success',
        data: results
      });

    } catch (error) {
      logger.error('Slack ingestion failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };

  /**
   * Ingest Google Drive documents
   */
  ingestGoogleDrive = async (req, res) => {
    try {
      const { fileIds, folderId, recursive = false } = req.body;

      let filesToProcess = [];

      if (fileIds && Array.isArray(fileIds)) {
        // Process specific files
        filesToProcess = fileIds.map(id => ({ id }));
      } else if (folderId) {
        // Process files from folder
        const searchResult = await this.googleDriveService.searchFiles('', folderId);
        filesToProcess = searchResult.files || [];
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Either fileIds array or folderId is required'
        });
      }

      const results = {
        processed: 0,
        stored: 0,
        failed: 0,
        errors: []
      };

      for (const file of filesToProcess) {
        try {
          results.processed++;

          // Get file metadata if not provided
          const fileInfo = file.name ? file : await this.googleDriveService.getFileInfo(file.id);
          
          // Extract text content
          const textContent = await this.googleDriveService.extractTextContent(fileInfo.id, fileInfo.mimeType);
          
          if (!textContent || textContent.trim().length === 0) {
            results.failed++;
            results.errors.push(`No text content found in file: ${fileInfo.name}`);
            continue;
          }

          // Process and store document
          const processedContent = documentProcessor.processText(textContent);
          
          await this.vectorService.storeVector(fileInfo.id, processedContent, {
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
            originalLength: textContent.length
          });

          results.stored++;
          logger.info(`Successfully ingested Google Drive file: ${fileInfo.name}`);

        } catch (fileError) {
          results.failed++;
          results.errors.push(`Failed to process file ${file.id}: ${fileError.message}`);
          logger.error(`Failed to ingest file ${file.id}:`, fileError);
        }
      }

      res.json({
        status: 'success',
        data: results
      });

    } catch (error) {
      logger.error('Google Drive ingestion failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };

  /**
   * Bulk ingest from Google Drive folder
   */
  bulkIngestGoogleDrive = async (req, res) => {
    try {
      const { folderId, recursive = false, fileTypes = [] } = req.body;

      if (!folderId) {
        return res.status(400).json({
          status: 'error',
          message: 'Folder ID is required for bulk ingestion'
        });
      }

      // Get all files from folder
      const allFiles = await this.googleDriveService.getAllFilesFromFolder(folderId, recursive);
      
      // Filter by file types if specified
      const filesToProcess = fileTypes.length > 0 
        ? allFiles.filter(file => fileTypes.includes(file.mimeType))
        : allFiles;

      const results = {
        totalFiles: filesToProcess.length,
        processed: 0,
        stored: 0,
        failed: 0,
        errors: []
      };

      // Process in batches
      const batchSize = 5;
      for (let i = 0; i < filesToProcess.length; i += batchSize) {
        const batch = filesToProcess.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (file) => {
          try {
            results.processed++;

            const textContent = await this.googleDriveService.extractTextContent(file.id, file.mimeType);
            
            if (!textContent || textContent.trim().length === 0) {
              results.failed++;
              results.errors.push(`No text content: ${file.name}`);
              return;
            }

            const processedContent = documentProcessor.processText(textContent);
            
            await this.vectorService.storeVector(file.id, processedContent, {
              source: 'google-drive',
              fileId: file.id,
              fileName: file.name,
              mimeType: file.mimeType,
              size: file.size,
              createdTime: file.createdTime,
              modifiedTime: file.modifiedTime,
              webViewLink: file.webViewLink,
              owners: file.owners || [],
              parents: file.parents || [],
              originalLength: textContent.length,
              ingestedAt: new Date().toISOString()
            });

            results.stored++;

          } catch (error) {
            results.failed++;
            results.errors.push(`${file.name}: ${error.message}`);
            logger.error(`Batch processing failed for ${file.id}:`, error);
          }
        }));
      }

      res.json({
        status: 'success',
        data: results
      });

    } catch (error) {
      logger.error('Bulk Google Drive ingestion failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };

  /**
   * Get ingestion status/stats
   */
  getIngestionStats = async (req, res) => {
    try {
      const stats = await this.vectorService.getCollectionStats();
      
      res.json({
        status: 'success',
        data: stats
      });

    } catch (error) {
      logger.error('Get ingestion stats failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };
}

module.exports = new IngestController();
