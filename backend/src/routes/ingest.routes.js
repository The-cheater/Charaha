const express = require('express');
const ingestController = require('../controllers/ingest.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateIngestRequest, validateGoogleDriveIngest } = require('../utils/validators');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Slack ingestion
router.post('/slack', validateIngestRequest, ingestController.ingestSlack);

// Bulk Slack ingestion
router.post('/slack/bulk', validateIngestRequest, ingestController.bulkIngestSlack);

// Get Slack channels
router.get('/slack/channels', ingestController.getSlackChannels);

// Search Slack messages
router.get('/slack/search', ingestController.searchSlack);

// Google Drive ingestion
router.post('/google-drive', validateGoogleDriveIngest, ingestController.ingestDrive);

// Bulk Google Drive ingestion
router.post('/google-drive/bulk', validateGoogleDriveIngest, ingestController.bulkIngestDrive);

// Get ingestion sources
router.get('/sources', ingestController.getSources);
router.get('/sources/:sourceId', ingestController.getSourceStatus);
router.delete('/sources/:sourceId', ingestController.deleteSource);

module.exports = router;
