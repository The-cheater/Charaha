module.exports = {
    server: {
      port: process.env.PORT || 4000,
      env: process.env.NODE_ENV || 'development',
    },
    
    chunking: {
      maxChunkSize: 1000,
      overlapSize: 200,
    },
  
    embedding: {
      model: process.env.HF_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
      vectorSize: 384,
    },
  
    search: {
      defaultTopK: 5,
      maxTopK: 20,
    },
  
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    }
  };
  