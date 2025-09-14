const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
    required: true
  },
  externalId: {
    type: String,
    required: true // Message ID, paragraph ID, etc.
  },
  qdrantPointId: {
    type: String,
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  startChar: {
    type: Number,
    default: 0
  },
  endChar: {
    type: Number,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  metadata: {
    channel: String,
    messageId: String,
    threadId: String,
    fileName: String,
    pageNumber: Number,
    heading: String,
    type: {
      type: String,
      enum: ['text', 'code', 'quote', 'list'],
      default: 'text'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chunkSchema.index({ sourceId: 1, timestamp: -1 });
chunkSchema.index({ qdrantPointId: 1 }, { unique: true });
chunkSchema.index({ author: 1, timestamp: -1 });
chunkSchema.index({ 'metadata.channel': 1, timestamp: -1 });

module.exports = mongoose.model('Chunk', chunkSchema);
