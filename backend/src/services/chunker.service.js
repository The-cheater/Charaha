const crypto = require('crypto');
const logger = require('../utils/logger');

// Generate UUID without external dependency
function generateUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

class ChunkerService {
  constructor() {
    // Default chunking configuration
    this.maxChunkSize = process.env.MAX_CHUNK_SIZE || 1000;
    this.overlapSize = process.env.OVERLAP_SIZE || 100;
  }

  /**
   * Normalize text for processing
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ');
    
    // Remove HTML tags (basic)
    text = text.replace(/<[^>]*>/g, '');
    
    // Normalize quotes
    text = text.replace(/[""]/g, '"').replace(/['']/g, "'");
    
    return text.trim();
  }

  /**
   * Chunk text into smaller pieces
   */
  chunkText(text, metadata = {}) {
    const normalizedText = this.normalizeText(text);
    const chunks = [];

    if (normalizedText.length <= this.maxChunkSize) {
      return [{
        id: generateUUID(),
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
          id: generateUUID(),
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

  /**
   * Chunk a document with title and content
   */
  chunkDocument(document, metadata = {}) {
    const { title, content, author, timestamp, url } = document;
    const fullText = title ? `${title}\n\n${content}` : content;

    return this.chunkText(fullText, {
      ...metadata,
      originalLength: content?.length || 0,
      hasTitle: !!title,
      author,
      timestamp,
      url
    });
  }

  /**
   * Chunk a Slack message
   */
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

  /**
   * Chunk Google Drive document content
   */
  chunkGoogleDoc(docContent, fileMetadata = {}) {
    const { name, mimeType, webViewLink } = fileMetadata;

    return this.chunkText(docContent, {
      type: 'google_drive',
      fileName: name,
      mimeType,
      url: webViewLink
    });
  }

  /**
   * Get chunking statistics
   */
  getStats(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return {
        totalChunks: 0,
        totalCharacters: 0,
        avgChunkSize: 0,
        maxChunkSize: 0,
        minChunkSize: 0
      };
    }

    const sizes = chunks.map(chunk => chunk.text.length);
    const totalCharacters = sizes.reduce((sum, size) => sum + size, 0);

    return {
      totalChunks: chunks.length,
      totalCharacters,
      avgChunkSize: Math.round(totalCharacters / chunks.length),
      maxChunkSize: Math.max(...sizes),
      minChunkSize: Math.min(...sizes)
    };
  }

  /**
   * Validate chunk configuration
   */
  validateConfig() {
    const issues = [];

    if (this.maxChunkSize <= 0) {
      issues.push('maxChunkSize must be positive');
    }

    if (this.overlapSize < 0) {
      issues.push('overlapSize must be non-negative');
    }

    if (this.overlapSize >= this.maxChunkSize) {
      issues.push('overlapSize must be less than maxChunkSize');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Update configuration
   */
  updateConfig({ maxChunkSize, overlapSize }) {
    if (maxChunkSize) this.maxChunkSize = maxChunkSize;
    if (overlapSize) this.overlapSize = overlapSize;

    const validation = this.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Invalid chunking configuration: ${validation.issues.join(', ')}`);
    }

    logger.info(`Updated chunking config: maxChunkSize=${this.maxChunkSize}, overlapSize=${this.overlapSize}`);
  }
}

module.exports = new ChunkerService();
