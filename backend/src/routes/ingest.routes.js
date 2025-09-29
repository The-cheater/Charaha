const express = require('express');
const ingestController = require('../controllers/ingest.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateIngestRequest, validateGoogleDriveIngest } = require('../utils/validators');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Slack ingestion
router.post('/slack', validateIngestRequest, ingestController.ingestSlackMessages);

// Google Drive ingestion
router.post('/google-drive', validateGoogleDriveIngest, ingestController.ingestGoogleDrive);

// Bulk Google Drive ingestion
router.post('/google-drive/bulk', validateGoogleDriveIngest, ingestController.bulkIngestGoogleDrive);

// Get ingestion statistics
router.get('/stats', ingestController.getIngestionStats);

module.exports = router;
