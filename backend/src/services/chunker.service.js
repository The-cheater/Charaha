const { v4: uuidv4 } = require('uuid');
const config = require('../config/app.config');
const logger = require('../utils/logger');

class ChunkerService {
  constructor() {
    this.maxChunkSize = config.chunking.maxChunkSize;
    this.overlapSize = config.chunking.overlapSize;
  }

  normalizeText(text) {
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ');
    
    // Remove HTML tags (basic)
    text = text.replace(/<[^>]*>/g, '');
    
    // Normalize quotes
    text = text.replace(/[""]/g, '"').replace(/['']/g, "'");
    
    return text.trim();
  }

  chunkText(text, metadata = {}) {
    const normalizedText = this.normalizeText(text);
    const chunks = [];

    if (normalizedText.length <= this.maxChunkSize) {
      return [{
        id: uuidv4(),
        text: normalizedText,
        startChar: 0,
        endChar: normalizedText.length,
        metadata: {
          ...metadata,
          chunkIndex: 0,
          totalChunks: 1
        }
      }];
    }

    let start = 0;
    let chunkIndex = 0;

    while (start < normalizedText.length) {
      let end = Math.min(start + this.maxChunkSize, normalizedText.length);

      // Try to break at sentence boundary
      if (end < normalizedText.length) {
        const sentenceEnd = normalizedText.lastIndexOf('.', end);
        const questionEnd = normalizedText.lastIndexOf('?', end);
        const exclamationEnd = normalizedText.lastIndexOf('!', end);
        
        const bestEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd);
        if (bestEnd > start + this.maxChunkSize * 0.5) {
          end = bestEnd + 1;
        }
      }

      const chunkText = normalizedText.slice(start, end);
      
      if (chunkText.trim().length > 0) {
        chunks.push({
          id: uuidv4(),
          text: chunkText.trim(),
          startChar: start,
          endChar: end,
          metadata: {
            ...metadata,
            chunkIndex,
            totalChunks: 0 // Will be updated after all chunks are created
          }
        });
      }

      // Move start position with overlap
      start = Math.max(start + this.maxChunkSize - this.overlapSize, end);
      chunkIndex++;
    }

    // Update total chunks count
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    logger.info(`Created ${chunks.length} chunks from text of length ${normalizedText.length}`);
    return chunks;
  }

  chunkDocument(document, metadata = {}) {
    const { title, content, author, timestamp, url } = document;
    
    const fullText = title ? `${title}\n\n${content}` : content;
    
    return this.chunkText(fullText, {
      ...metadata,
      originalLength: content.length,
      hasTitle: !!title,
      author,
      timestamp,
      url
    });
  }

  chunkSlackMessage(message, channelInfo = {}) {
    const { text, user, ts, thread_ts, channel } = message;
    
    return this.chunkText(text, {
      type: 'slack_message',
      messageId: ts,
      threadId: thread_ts,
      channel: channelInfo.name || channel,
      channelId: channel,
      author: user,
      timestamp: new Date(parseFloat(ts) * 1000),
      isThread: !!thread_ts
    });
  }
}

module.exports = new ChunkerService();
