const ingestService = require('../services/ingest.service');
const Source = require('../models/mongodb/source.model');
const logger = require('../utils/logger');

class IngestController {
  async ingestSlack(req, res, next) {
    try {
      const { channel, since, workspace } = req.body;
      const userId = req.user._id;

      logger.info(`Starting Slack ingestion for channel ${channel}`);

      const result = await ingestService.ingestSlackChannel({
        channel,
        since,
        workspace,
        userId
      });

      res.status(200).json({
        status: 'success',
        message: 'Slack channel ingestion completed',
        data: result
      });
    } catch (error) {
      logger.error('Slack ingestion error:', error);
      next(error);
    }
  }

  async ingestDrive(req, res, next) {
    try {
      const { fileId, since, folderId } = req.body;
      const userId = req.user._id;

      logger.info(`Starting Google Drive ingestion for ${fileId || folderId}`);

      const result = await ingestService.ingestGoogleDrive({
        fileId,
        folderId,
        since,
        userId
      });

      res.status(200).json({
        status: 'success',
        message: 'Google Drive ingestion completed',
        data: result
      });
    } catch (error) {
      logger.error('Drive ingestion error:', error);
      next(error);
    }
  }

  async getSources(req, res, next) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10, type } = req.query;

      const filter = { userId };
      if (type) filter.type = type;

      const sources = await Source.find(filter)
        .sort({ ingestedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Source.countDocuments(filter);

      res.status(200).json({
        status: 'success',
        data: {
          sources,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      logger.error('Get sources error:', error);
      next(error);
    }
  }

  async getSourceStatus(req, res, next) {
    try {
      const { sourceId } = req.params;
      const userId = req.user._id;

      const source = await Source.findOne({ _id: sourceId, userId });
      
      if (!source) {
        return res.status(404).json({
          status: 'error',
          message: 'Source not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { source }
      });
    } catch (error) {
      logger.error('Get source status error:', error);
      next(error);
    }
  }

  async deleteSource(req, res, next) {
    try {
      const { sourceId } = req.params;
      const userId = req.user._id;

      const result = await ingestService.deleteSource(sourceId, userId);

      res.status(200).json({
        status: 'success',
        message: 'Source deleted successfully',
        data: result
      });
    } catch (error) {
      logger.error('Delete source error:', error);
      next(error);
    }
  }

  async bulkIngestSlack(req, res, next) {
    try {
      const { channels, since, workspace } = req.body;
      const userId = req.user._id;

      logger.info(`Starting bulk Slack ingestion for ${channels.length} channels`);

      const results = await Promise.allSettled(
        channels.map(channel => 
          ingestService.ingestSlackChannel({ channel, since, workspace, userId })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      res.status(200).json({
        status: 'success',
        message: `Bulk ingestion completed: ${successful} successful, ${failed} failed`,
        data: {
          successful,
          failed,
          results: results.map((r, i) => ({
            channel: channels[i],
            status: r.status,
            data: r.status === 'fulfilled' ? r.value : null,
            error: r.status === 'rejected' ? r.reason.message : null
          }))
        }
      });
    } catch (error) {
      logger.error('Bulk Slack ingestion error:', error);
      next(error);
    }
  }

  async bulkIngestDrive(req, res, next) {
    try {
      const { fileIds, folderId, since } = req.body;
      const userId = req.user._id;

      logger.info(`Starting bulk Drive ingestion for ${fileIds?.length || 1} items`);

      let items = fileIds || [];
      if (folderId && !fileIds) {
        // Get all files in folder
        const folderFiles = await googleService.getFilesInFolder(folderId);
        items = folderFiles.map(f => f.id);
      }

      const results = await Promise.allSettled(
        items.map(fileId => 
          ingestService.ingestGoogleDrive({ fileId, since, userId })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      res.status(200).json({
        status: 'success',
        message: `Bulk ingestion completed: ${successful} successful, ${failed} failed`,
        data: {
          successful,
          failed,
          results: results.map((r, i) => ({
            fileId: items[i],
            status: r.status,
            data: r.status === 'fulfilled' ? r.value : null,
            error: r.status === 'rejected' ? r.reason.message : null
          }))
        }
      });
    } catch (error) {
      logger.error('Bulk Drive ingestion error:', error);
      next(error);
    }
  }
}

module.exports = new IngestController();
