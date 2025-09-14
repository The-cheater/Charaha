const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  filters: {
    sources: [String],
    dateFrom: Date,
    dateTo: Date,
    authors: [String]
  },
  results: [{
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chunk'
    },
    score: Number,
    rank: Number
  }],
  resultCount: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number, // in milliseconds
    required: true
  }
}, {
  timestamps: true
});

// Indexes
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ query: 'text' });

// TTL index to automatically delete old search history (optional)
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
