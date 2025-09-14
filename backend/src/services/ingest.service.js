const slackService = require('./slack.service');
const googleService = require('./google.service');
const chunkerService = require('./chunker.service');
const hfService = require('./hf.service');
const qdrantService = require('./qdrant.service');
const Source = require('../models/mongodb/source.model');
const Chunk = require('../models/mongodb/chunk.model');
const logger = require('../utils/logger');

class IngestService {
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

      // Fetch messages
      const messages = await slackService.getChannelHistory(channel, {
        oldest: since ? new Date(since).getTime() / 1000 : undefined,
        limit: 1000
      });

      let processedCount = 0;
      const batchSize = 10;

      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        await this.processBatchMessages(batch, channelInfo, source);
        processedCount += batch.length;
        
        logger.info(`Processed ${processedCount}/${messages.length} messages for channel ${channel}`);
      }

      // Update source status
      source.status = 'completed';
      source.lastSyncAt = new Date();
      source.stats.totalMessages = messages.length;
      source.stats.lastMessageDate = messages.length > 0 ? 
        new Date(parseFloat(messages[0].ts) * 1000) : null;
      await source.save();

      return {
        sourceId: source._id,
        messagesProcessed: processedCount,
        chunksCreated: await Chunk.countDocuments({ sourceId: source._id })
      };

    } catch (error) {
      logger.error('Slack ingestion error:', error);
      throw error;
    }
  }

  async processBatchMessages(messages, channelInfo, source) {
    const chunks = [];
    const embeddings = [];

    for (const message of messages) {
      if (!message.text || message.subtype) continue;

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
        const embedding = await hfService.generateEmbedding(chunk.text);
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
          channel: channelInfo.name
        }
      }));

      // Upsert to Qdrant
      const pointIds = await qdrantService.upsertPoints(vectorPoints);
      
      // Update chunks with Qdrant point IDs
      await Promise.all(savedChunks.map((chunk, index) => {
        chunk.qdrantPointId = pointIds[index];
        return chunk.save();
      }));
    }
  }

  async ingestGoogleDrive({ fileId, folderId, since, userId }) {
    try {
      let filesToProcess = [];

      if (fileId) {
        filesToProcess = [{ id: fileId }];
      } else if (folderId) {
        filesToProcess = await googleService.getFilesInFolder(folderId);
      }

      const results = [];

      for (const file of filesToProcess) {
        try {
          const result = await this.processGoogleFile(file.id, userId, since);
          results.push(result);
        } catch (error) {
          logger.error(`Error processing file ${file.id}:`, error);
          results.push({ fileId: file.id, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error('Google Drive ingestion error:', error);
      throw error;
    }
  }

  async processGoogleFile(fileId, userId, since) {
    // Get file metadata
    const fileMetadata = await googleService.getFileMetadata(fileId);
    
    // Skip if file was modified before 'since' date
    if (since && new Date(fileMetadata.modifiedTime) < new Date(since)) {
      return { fileId, skipped: true, reason: 'Not modified since last sync' };
    }

    // Get or create source
    let source = await Source.findOne({
      type: 'google_doc',
      externalId: fileId,
      userId
    });

    if (!source) {
      source = await Source.create({
        type: 'google_doc',
        externalId: fileId,
        name: fileMetadata.name,
        metadata: {
          url: fileMetadata.webViewLink,
          mimeType: fileMetadata.mimeType,
          size: fileMetadata.size
        },
        userId,
        status: 'processing'
      });
    } else {
      source.status = 'processing';
      await source.save();
    }

    let content;
    
    // Handle different file types
    if (fileMetadata.mimeType === 'application/vnd.google-apps.document') {
      const doc = await googleService.getDocumentContent(fileId);
      content = {
        title: doc.title,
        text: doc.content,
        author: fileMetadata.owners?.[0]?.displayName || 'Unknown'
      };
    } else {
      // For other file types, try to export as plain text
      const textContent = await googleService.exportDocument(fileId, 'text/plain');
      content = {
        title: fileMetadata.name,
        text: textContent,
        author: fileMetadata.owners?.[0]?.displayName || 'Unknown'
      };
    }

    // Chunk the content
    const chunks = chunkerService.chunkText(content.text, {
      title: content.title,
      author: content.author,
      fileName: fileMetadata.name,
      url: fileMetadata.webViewLink
    });

    // Generate embeddings
    const embeddings = await hfService.generateEmbeddings(
      chunks.map(chunk => chunk.text)
    );

    // Save chunks
    const chunkDocs = chunks.map((chunk, index) => ({
      sourceId: source._id,
      externalId: fileId,
      text: chunk.text,
      startChar: chunk.startChar,
      endChar: chunk.endChar,
      author: content.author,
      timestamp: new Date(fileMetadata.modifiedTime),
      metadata: {
        ...chunk.metadata,
        fileName: fileMetadata.name
      }
    }));

    const savedChunks = await Chunk.insertMany(chunkDocs);

    // Create vector points
    const vectorPoints = savedChunks.map((chunk, index) => ({
      id: chunk._id.toString(),
      vector: embeddings[index],
      payload: {
        chunkId: chunk._id.toString(),
        sourceType: 'google_doc',
        sourceUrl: fileMetadata.webViewLink,
        author: chunk.author,
        timestamp: chunk.timestamp.toISOString(),
        fileName: fileMetadata.name
      }
    }));

    // Upsert to Qdrant
    const pointIds = await qdrantService.upsertPoints(vectorPoints);

    // Update chunks with Qdrant point IDs
    await Promise.all(savedChunks.map((chunk, index) => {
      chunk.qdrantPointId = pointIds[index];
      return chunk.save();
    }));

    // Update source status
    source.status = 'completed';
    source.lastSyncAt = new Date();
    source.stats.totalChunks = savedChunks.length;
    await source.save();

    return {
      sourceId: source._id,
      fileId,
      chunksCreated: savedChunks.length
    };
  }

  async deleteSource(sourceId, userId) {
    try {
      const source = await Source.findOne({ _id: sourceId, userId });
      
      if (!source) {
        throw new Error('Source not found');
      }

      // Get all chunks for this source
      const chunks = await Chunk.find({ sourceId });
      const pointIds = chunks.map(chunk => chunk.qdrantPointId).filter(Boolean);

      // Delete from Qdrant
      if (pointIds.length > 0) {
        await qdrantService.deletePoints(pointIds);
      }

      // Delete chunks from MongoDB
      await Chunk.deleteMany({ sourceId });

      // Delete source
      await Source.findByIdAndDelete(sourceId);

      return {
        deletedChunks: chunks.length,
        deletedVectorPoints: pointIds.length
      };
    } catch (error) {
      logger.error('Delete source error:', error);
      throw error;
    }
  }
}

module.exports = new IngestService();
