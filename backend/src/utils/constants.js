module.exports = {
    // Source types
    SOURCE_TYPES: {
      SLACK_CHANNEL: 'slack_channel',
      GOOGLE_DOC: 'google_doc',
      GOOGLE_DRIVE_FOLDER: 'google_drive_folder'
    },
  
    // Source statuses
    SOURCE_STATUSES: {
      PENDING: 'pending',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed'
    },
  
    // User roles
    USER_ROLES: {
      USER: 'user',
      ADMIN: 'admin'
    },
  
    // Chunk types
    CHUNK_TYPES: {
      TEXT: 'text',
      CODE: 'code',
      QUOTE: 'quote',
      LIST: 'list'
    },
  
    // File MIME types
    SUPPORTED_MIME_TYPES: {
      GOOGLE_DOC: 'application/vnd.google-apps.document',
      GOOGLE_SHEET: 'application/vnd.google-apps.spreadsheet',
      GOOGLE_SLIDE: 'application/vnd.google-apps.presentation',
      PDF: 'application/pdf',
      TEXT: 'text/plain',
      MARKDOWN: 'text/markdown'
    },
  
    // Rate limits
    RATE_LIMITS: {
      SEARCH: { windowMs: 60000, max: 30 }, // 30 searches per minute
      INGEST: { windowMs: 300000, max: 5 }, // 5 ingestions per 5 minutes
      AUTH: { windowMs: 900000, max: 5 } // 5 login attempts per 15 minutes
    },
  
    // Embedding settings
    EMBEDDING: {
      MODEL: 'sentence-transformers/all-MiniLM-L6-v2',
      VECTOR_SIZE: 384,
      MAX_INPUT_LENGTH: 512
    },
  
    // Chunking settings
    CHUNKING: {
      DEFAULT_MAX_SIZE: 1000,
      DEFAULT_OVERLAP: 200,
      MIN_CHUNK_SIZE: 50
    },
  
    // Search settings
    SEARCH: {
      DEFAULT_TOP_K: 5,
      MAX_TOP_K: 20,
      SIMILARITY_THRESHOLD: 0.5
    }
  };
  