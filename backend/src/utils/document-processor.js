const logger = require('./logger');

class DocumentProcessor {
  /**
   * Process and clean text content for better vectorization
   */
  processText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    try {
      let processed = text;

      // Remove excessive whitespace
      processed = processed.replace(/\s+/g, ' ');
      
      // Remove special characters but keep basic punctuation
      processed = processed.replace(/[^\w\s.,!?;:()\-]/g, ' ');
      
      // Remove multiple consecutive punctuation
      processed = processed.replace(/[.,!?;:]{2,}/g, '.');
      
      // Normalize line breaks
      processed = processed.replace(/\n+/g, '\n');
      
      // Trim and ensure minimum length
      processed = processed.trim();
      
      // Split into sentences and filter out very short ones
      const sentences = processed.split(/[.!?]+/).filter(sentence => 
        sentence.trim().length > 10
      );
      
      return sentences.join('. ').trim();
      
    } catch (error) {
      logger.error('Text processing failed:', error);
      return text; // Return original if processing fails
    }
  }

  /**
   * Extract metadata from document content
   */
  extractMetadata(text, source = 'unknown') {
    const metadata = {
      wordCount: 0,
      sentenceCount: 0,
      avgSentenceLength: 0,
      hasCode: false,
      hasUrls: false,
      languages: [],
      topics: []
    };

    try {
      if (!text || typeof text !== 'string') {
        return metadata;
      }

      // Word count
      metadata.wordCount = text.split(/\s+/).length;

      // Sentence count
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      metadata.sentenceCount = sentences.length;

      // Average sentence length
      if (metadata.sentenceCount > 0) {
        metadata.avgSentenceLength = Math.round(metadata.wordCount / metadata.sentenceCount);
      }

      // Check for code patterns - FIXED REGEX
      metadata.hasCode = /```/.test(text);

      // Check for URLs
      metadata.hasUrls = /https?:\/\/[^\s]+/.test(text);

      // Simple topic extraction (basic keywords)
      const keywords = this.extractKeywords(text);
      metadata.topics = keywords;

      return metadata;

    } catch (error) {
      logger.error('Metadata extraction failed:', error);
      return metadata;
    }
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  extractKeywords(text, limit = 10) {
    try {
      // Common stop words to filter out
      const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'among', 'as', 'is',
        'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
        'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
        'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
        'they', 'them', 'their', 'there', 'where', 'when', 'why', 'how', 'what'
      ]);

      // Extract words and count frequency
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          !stopWords.has(word) && 
          !/^\d+$/.test(word)
        );

      const wordCount = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

      // Sort by frequency and return top keywords
      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([word]) => word);

    } catch (error) {
      logger.error('Keyword extraction failed:', error);
      return [];
    }
  }

  /**
   * Chunk large documents into smaller pieces
   */
  chunkDocument(text, maxChunkSize = 1000, overlap = 100) {
    try {
      if (!text || text.length <= maxChunkSize) {
        return [text];
      }

      const chunks = [];
      let start = 0;

      while (start < text.length) {
        let end = Math.min(start + maxChunkSize, text.length);
        
        // Try to end at a sentence boundary
        if (end < text.length) {
          const lastPeriod = text.lastIndexOf('.', end);
          const lastExclamation = text.lastIndexOf('!', end);
          const lastQuestion = text.lastIndexOf('?', end);
          
          const sentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
          if (sentenceEnd > start + maxChunkSize * 0.5) {
            end = sentenceEnd + 1;
          }
        }

        chunks.push(text.substring(start, end).trim());
        start = Math.max(start + maxChunkSize - overlap, end);
      }

      return chunks.filter(chunk => chunk.length > 50);

    } catch (error) {
      logger.error('Document chunking failed:', error);
      return [text];
    }
  }
}

module.exports = new DocumentProcessor();
