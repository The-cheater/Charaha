const express = require('express');
const queryController = require('../controllers/query.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateQueryRequest } = require('../utils/validators');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Main search endpoint - FIXED IMPORT
router.post('/', validateQueryRequest, queryController.search);

// Source-specific search
router.post('/:source', validateQueryRequest, queryController.searchBySource);

// Search statistics
router.get('/stats', queryController.getStats);

module.exports = router;
