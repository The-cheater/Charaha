const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingest.controller');
const authController = require('../controllers/auth.controller');
const { validateSlackIngest, validateDriveIngest } = require('../utils/validators');

// All ingestion routes require authentication
router.use(authController.authenticate);

// Manual ingestion endpoints
router.post('/slack', validateSlackIngest, ingestController.ingestSlack);
router.post('/drive', validateDriveIngest, ingestController.ingestDrive);

// Ingestion status and management
router.get('/sources', ingestController.getSources);
router.get('/sources/:sourceId/status', ingestController.getSourceStatus);
router.delete('/sources/:sourceId', ingestController.deleteSource);

// Bulk operations
router.post('/bulk/slack', ingestController.bulkIngestSlack);
router.post('/bulk/drive', ingestController.bulkIngestDrive);

module.exports = router;
