const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['slack_channel', 'google_doc', 'google_drive_folder']
  },
  externalId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  metadata: {
    url: String,
    workspace: String,
    fileName: String,
    folderPath: String,
    mimeType: String,
    permissions: [String]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ingestedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncAt: Date,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  stats: {
    totalChunks: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    lastMessageDate: Date
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
sourceSchema.index({ type: 1, externalId: 1, userId: 1 }, { unique: true });
sourceSchema.index({ userId: 1, ingestedAt: -1 });

module.exports = mongoose.model('Source', sourceSchema);
