const slackService = require('./slack.service');
const googleDriveService = require('./google-drive.service');
const chunkerService = require('./chunker.service');
const embeddingService = require('./embedding.service');
const vectorService = require('./vector.service');
const analyticsService = require('./analytics.service');
const Source = require('../models/mongodb/source.model');
const Chunk = require('../models/mongodb/chunk.model');
const logger = require('../utils/logger');

class IngestService {
  /**
   * Ingest Slack channel messages
   */
  async ingestSlackChannel({ channel, since, workspace, userId }) {
    try {
      // Get or create source
      let source = await Source.findOne({
        type: 'slack_channel',
        externalId: channel,
        userId
      });

      const channelInfo = await slackService.getChannelInfo(channel);

      if (!source) {
        source = await Source.create({
          type: 'slack_channel',
          externalId: channel,
          name: channelInfo.name,
          metadata: {
            workspace,
            url: `https://slack.com/channels/${channel}`
          },
          userId,
          status: 'processing'
        });
      } else {
        source.status = 'processing';
        await source.save();
      }

      // Fetch messages with pagination
      let totalProcessed = 0;
      let hasMore = true;
      let oldest = since;

      while (hasMore) {
        const messages = await slackService.getChannelMessages(channel, {
          oldest,
          limit: 100
        });

        if (!messages || messages.length === 0) {
          hasMore = false;
          break;
        }

        // Process batch
        await this.processBatchMessages(messages, channelInfo, source);
        totalProcessed += messages.length;

        // Update progress
        await this.updateSourceProgress(source._id, {
          processed: totalProcessed,
          stage: 'processing_messages'
        });

        // Set next oldest for pagination
        oldest = messages[messages.length - 1].timestamp;
        
        // Rate limiting
        await this.delay(1000);
      }

      // Update source status
      source.status = 'completed';
      source.stats = {
        ...source.stats,
        totalMessages: totalProcessed,
        lastSyncAt: new Date()
      };
      await source.save();

      logger.info(`✅ Slack ingestion completed for channel ${channelInfo.name}: ${totalProcessed} messages`);

      return {
        sourceId: source._id,
        messagesProcessed: totalProcessed,
        status: 'completed'
      };

    } catch (error) {
      logger.error(`❌ Slack ingestion failed for channel ${channel}:`, error);
      
      // Update source status to failed
      if (source) {
        source.status = 'failed';
        source.error = error.message;
        await source.save();
      }
      
      throw error;
    }
  }

  /**
   * Process batch of messages
   */
  async processBatchMessages(messages, channelInfo, source) {
    const chunks = [];
    const embeddings = [];

    for (const message of messages) {
      if (!message.text || message.subtype) continue;

      // Chunk the message
      const messageChunks = chunkerService.chunkSlackMessage(message, channelInfo);

      for (const chunk of messageChunks) {
        chunks.push({
          sourceId: source._id,
          externalId: message.ts,
          text: chunk.text,
          startChar: chunk.startChar,
          endChar: chunk.endChar,
          author: message.user,
          timestamp: new Date(parseFloat(message.ts) * 1000),
          metadata: {
            ...chunk.metadata,
            messageId: message.ts,
            threadId: message.thread_ts
          }
        });

        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(chunk.text);
        embeddings.push(embedding);
      }
    }

    // Save chunks and create vector points
    if (chunks.length > 0) {
      const savedChunks = await Chunk.insertMany(chunks);

      const vectorPoints = savedChunks.map((chunk, index) => ({
        id: chunk._id.toString(),
        vector: embeddings[index],
        payload: {
          chunkId: chunk._id.toString(),
          sourceType: 'slack',
          sourceUrl: `https://slack.com/archives/${channelInfo.id}/p${chunk.externalId.replace('.', '')}`,
          author: chunk.author,
          timestamp: chunk.timestamp.toISOString(),
          channel: channelInfo.name,
          userId: source.userId.toString()
        }
      }));

      // Add to vector database
      await vectorService.addVectors(vectorPoints);
    }
  }

  /**
   * Ingest Google Drive files
   */
  async ingestGoogleDriveFiles({ fileIds, folderId, userId }) {
    try {
      let filesToProcess = [];

      if (fileIds && fileIds.length > 0) {
        // Process specific files
        filesToProcess = fileIds;
      } else if (folderId) {
        // Get files from folder
        const searchResult = await googleDriveService.searchFiles({
          folder: folderId,
          pageSize: 100
        });
        filesToProcess = searchResult.files.map(f => f.id);
      } else {
        throw new Error('Either fileIds or folderId must be provided');
      }

      const results = [];

      for (const fileId of filesToProcess) {
        try {
          const result = await this.ingestGoogleDriveFile(fileId, userId);
          results.push(result);
        } catch (error) {
          logger.error(`❌ Failed to ingest file ${fileId}:`, error);
          results.push({
            fileId,
            status: 'failed',
            error: error.message
          });
        }
      }

      return {
        processed: results.length,
        successful: results.filter(r => r.status === 'completed').length,
        failed: results.filter(r => r.status === 'failed').length,
        results
      };

    } catch (error) {
      logger.error('❌ Google Drive batch ingestion failed:', error);
      throw error;
    }
  }

  /**
   * Ingest single Google Drive file
   */
  async ingestGoogleDriveFile(fileId, userId) {
    try {
      // Get file details
      const fileDetails = await googleDriveService.getFileDetails(fileId);

      // Create or update source
      let source = await Source.findOne({
        type: 'google_drive',
        externalId: fileId,
        userId
      });

      if (!source) {
        source = await Source.create({
          type: 'google_drive',
          externalId: fileId,
          name: fileDetails.name,
          metadata: {
            mimeType: fileDetails.mimeType,
            url: fileDetails.webViewLink,
            size: fileDetails.size,
            modifiedTime: fileDetails.modifiedTime
          },
          userId,
          status: 'processing'
        });
      } else {
        source.status = 'processing';
        await source.save();
      }

      // Extract content
      const contentResult = await googleDriveService.extractFileContent(
        fileId, 
        fileDetails.mimeType
      );

      // Chunk the content
      const chunks = chunkerService.chunkText(contentResult.content, {
        sourceType: 'google_drive',
        fileName: fileDetails.name,
        mimeType: fileDetails.mimeType
      });

      const savedChunks = [];
      const embeddings = [];

      // Process chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const chunkDoc = await Chunk.create({
          sourceId: source._id,
          externalId: `${fileId}_chunk_${i}`,
          text: chunk.text,
          startChar: chunk.startChar,
          endChar: chunk.endChar,
          metadata: {
            ...chunk.metadata,
            fileId,
            fileName: fileDetails.name
          }
        });

        savedChunks.push(chunkDoc);

        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(chunk.text);
        embeddings.push(embedding);
      }

      // Create vector points
      const vectorPoints = savedChunks.map((chunk, index) => ({
        id: chunk._id.toString(),
        vector: embeddings[index],
        payload: {
          chunkId: chunk._id.toString(),
          sourceType: 'google_drive',
          sourceUrl: fileDetails.webViewLink,
          fileName: fileDetails.name,
          mimeType: fileDetails.mimeType,
          userId: source.userId.toString()
        }
      }));

      // Add to vector database
      await vectorService.addVectors(vectorPoints);

      // Update source
      source.status = 'completed';
      source.stats = {
        totalChunks: savedChunks.length,
        totalCharacters: contentResult.content.length,
        lastSyncAt: new Date()
      };
      await source.save();

      logger.info(`✅ Google Drive file ingested: ${fileDetails.name} (${savedChunks.length} chunks)`);

      return {
        sourceId: source._id,
        fileId,
        fileName: fileDetails.name,
        chunksCreated: savedChunks.length,
        status: 'completed'
      };

    } catch (error) {
      logger.error(`❌ Google Drive file ingestion failed for ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Ingest text content directly
   */
  async ingestText({ text, title, userId, metadata = {} }) {
    try {
      // Create source
      const source = await Source.create({
        type: 'text',
        name: title || 'Text Content',
        metadata: {
          ...metadata,
          length: text.length
        },
        userId,
        status: 'processing'
      });

      // Chunk the text
      const chunks = chunkerService.chunkText(text, {
        sourceType: 'text',
        title
      });

      const savedChunks = [];
      const embeddings = [];

      // Process chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const chunkDoc = await Chunk.create({
          sourceId: source._id,
          externalId: `text_chunk_${i}`,
          text: chunk.text,
          startChar: chunk.startChar,
          endChar: chunk.endChar,
          metadata: chunk.metadata
        });

        savedChunks.push(chunkDoc);

        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(chunk.text);
        embeddings.push(embedding);
      }

      // Create vector points
      const vectorPoints = savedChunks.map((chunk, index) => ({
        id: chunk._id.toString(),
        vector: embeddings[index],
        payload: {
          chunkId: chunk._id.toString(),
          sourceType: 'text',
          title: title || 'Text Content',
          userId: source.userId.toString()
        }
      }));

      // Add to vector database
      await vectorService.addVectors(vectorPoints);

      // Update source
      source.status = 'completed';
      source.stats = {
        totalChunks: savedChunks.length,
        totalCharacters: text.length,
        lastSyncAt: new Date()
      };
      await source.save();

      logger.info(`✅ Text ingested: ${title} (${savedChunks.length} chunks)`);

      return {
        sourceId: source._id,
        chunksCreated: savedChunks.length,
        status: 'completed'
      };

    } catch (error) {
      logger.error('❌ Text ingestion failed:', error);
      throw error;
    }
  }

  /**
   * Delete ingested content
   */
  async deleteSource(sourceId, userId) {
    try {
      const source = await Source.findOne({ _id: sourceId, userId });
      if (!source) {
        throw new Error('Source not found or access denied');
      }

      // Get chunks to delete
      const chunks = await Chunk.find({ sourceId });
      const chunkIds = chunks.map(c => c._id.toString());

      // Delete from vector database
      if (chunkIds.length > 0) {
        await vectorService.deleteVectors({ 
          filter: { chunkId: { $in: chunkIds } }
        });
      }

      // Delete chunks
      await Chunk.deleteMany({ sourceId });

      // Delete source
      await Source.deleteOne({ _id: sourceId });

      logger.info(`✅ Deleted source: ${source.name} (${chunkIds.length} chunks)`);

      return {
        sourceId,
        chunksDeleted: chunkIds.length,
        status: 'deleted'
      };

    } catch (error) {
      logger.error(`❌ Failed to delete source ${sourceId}:`, error);
      throw error;
    }
  }

  /**
   * Get ingestion status
   */
  async getIngestionStatus(userId) {
    try {
      const sources = await Source.find({ userId })
        .select('name type status stats error createdAt updatedAt')
        .sort({ updatedAt: -1 });

      const summary = {
        total: sources.length,
        completed: sources.filter(s => s.status === 'completed').length,
        processing: sources.filter(s => s.status === 'processing').length,
        failed: sources.filter(s => s.status === 'failed').length
      };

      return {
        summary,
        sources
      };

    } catch (error) {
      logger.error('❌ Failed to get ingestion status:', error);
      throw error;
    }
  }

  /**
   * Update source progress (for WebSocket updates)
   */
  async updateSourceProgress(sourceId, progress) {
    try {
      // Emit progress via analytics service (which handles WebSocket)
      analyticsService.trackIngestionProgress(
        sourceId.userId, 
        sourceId, 
        progress
      );
    } catch (error) {
      logger.debug('Failed to emit progress update:', error);
    }
  }

  /**
   * Utility: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = await Source.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalChunks = await Chunk.countDocuments();

      return {
        status: 'healthy',
        sources: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        totalChunks,
        services: {
          slack: !!slackService,
          googleDrive: !!googleDriveService,
          embedding: !!embeddingService,
          vector: !!vectorService
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new IngestService();
