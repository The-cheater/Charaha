const mongoose = require('mongoose');

const webhookSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['slack', 'google_drive', 'github', 'custom'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'failed', 'expired'],
    default: 'active',
    index: true
  },
  channelId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  resourceId: {
    type: String,
    sparse: true
  },
  resourceUri: String,
  pageToken: String, // For Google Drive changes
  expiration: Date,
  config: {
    channels: [String], // Slack channels
    folders: [String],  // Google Drive folders
    events: [String],   // Event types to listen for
    filters: mongoose.Schema.Types.Mixed
  },
  webhookUrl: {
    type: String,
    required: true
  },
  secret: String, // For webhook verification
  lastTriggered: Date,
  errorCount: {
    type: Number,
    default: 0
  },
  lastError: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for performance
webhookSubscriptionSchema.index({ userId: 1, type: 1 });
webhookSubscriptionSchema.index({ channelId: 1, status: 1 });
webhookSubscriptionSchema.index({ expiration: 1 }, { sparse: true });

// Clean up expired subscriptions
webhookSubscriptionSchema.index({ expiration: 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { status: 'active' }
});

module.exports = mongoose.model('WebhookSubscription', webhookSubscriptionSchema);
