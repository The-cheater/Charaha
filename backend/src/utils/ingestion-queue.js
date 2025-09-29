const EventEmitter = require('events');
const logger = require('./logger');

class IngestionQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3;
    this.activeJobs = 0;
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      startTime: null
    };
  }

  /**
   * Add job to queue
   */
  addJob(jobData) {
    const job = {
      id: this.generateJobId(),
      data: jobData,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    this.queue.push(job);
    this.stats.total++;
    
    logger.info(`Added job to queue: ${job.id}`);
    this.emit('jobAdded', job);
    
    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return job.id;
  }

  /**
   * Start processing queue
   */
  async startProcessing() {
    if (this.processing) return;
    
    this.processing = true;
    this.stats.startTime = new Date();
    
    logger.info('Starting queue processing');
    this.emit('processingStarted');

    while (this.queue.length > 0 && this.processing) {
      // Wait if we've reached max concurrent jobs
      while (this.activeJobs >= this.maxConcurrent) {
        await this.sleep(100);
      }

      const job = this.queue.shift();
      if (job) {
        this.processJob(job);
      }
    }

    this.processing = false;
    logger.info('Queue processing completed');
    this.emit('processingCompleted', this.stats);
  }

  /**
   * Process individual job
   */
  async processJob(job) {
    this.activeJobs++;
    job.status = 'processing';
    job.startedAt = new Date();
    
    logger.info(`Processing job: ${job.id}`);
    this.emit('jobStarted', job);

    try {
      // Call the appropriate processor based on job type
      await this.executeJob(job);
      
      job.status = 'completed';
      job.completedAt = new Date();
      this.stats.completed++;
      
      logger.info(`Job completed: ${job.id}`);
      this.emit('jobCompleted', job);

    } catch (error) {
      job.attempts++;
      job.error = error.message;
      
      if (job.attempts < job.maxAttempts) {
        // Retry job
        job.status = 'pending';
        this.queue.push(job);
        logger.warn(`Job failed, retrying (${job.attempts}/${job.maxAttempts}): ${job.id}`);
        this.emit('jobRetry', job);
      } else {
        // Max attempts reached
        job.status = 'failed';
        job.failedAt = new Date();
        this.stats.failed++;
        
        logger.error(`Job failed permanently: ${job.id}`, error);
        this.emit('jobFailed', job);
      }
    } finally {
      this.activeJobs--;
    }
  }

  /**
   * Execute job based on type
   */
  async executeJob(job) {
    const { type, data } = job.data;

    switch (type) {
      case 'google-drive-ingest':
        return await this.processGoogleDriveIngestion(data);
      case 'slack-ingest':
        return await this.processSlackIngestion(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Process Google Drive ingestion job
   */
  async processGoogleDriveIngestion(data) {
    const { fileId, driveService, vectorService } = data;
    
    // Get file info
    const fileInfo = await driveService.getFileInfo(fileId);
    
    // Extract text
    const textContent = await driveService.extractTextContent(fileId, fileInfo.mimeType);
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content extracted');
    }

    // Store in vector database
    await vectorService.storeVector(fileId, textContent, {
      source: 'google-drive',
      fileId: fileInfo.id,
      fileName: fileInfo.name,
      mimeType: fileInfo.mimeType,
      // ... other metadata
    });

    return { fileId, fileName: fileInfo.name, textLength: textContent.length };
  }

  /**
   * Process Slack ingestion job
   */
  async processSlackIngestion(data) {
    const { messageId, slackService, vectorService } = data;
    
    // Implementation for Slack message processing
    // Similar pattern to Google Drive
    
    return { messageId };
  }

  /**
   * Stop processing
   */
  stopProcessing() {
    this.processing = false;
    logger.info('Queue processing stopped');
    this.emit('processingStopped');
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queue: {
        pending: this.queue.filter(job => job.status === 'pending').length,
        processing: this.activeJobs,
        total: this.queue.length
      },
      stats: {
        ...this.stats,
        successRate: this.stats.total > 0 ? (this.stats.completed / this.stats.total * 100).toFixed(2) : 0,
        runtime: this.stats.startTime ? new Date() - this.stats.startTime : 0
      },
      processing: this.processing
    };
  }

  /**
   * Clear completed jobs
   */
  clearCompleted() {
    const completedCount = this.queue.filter(job => 
      job.status === 'completed' || job.status === 'failed'
    ).length;
    
    this.queue = this.queue.filter(job => 
      job.status !== 'completed' && job.status !== 'failed'
    );
    
    logger.info(`Cleared ${completedCount} completed jobs`);
    return completedCount;
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
module.exports = new IngestionQueue();
