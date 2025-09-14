const express = require('express');
const router = express.Router();
const queryController = require('../controllers/query.controller');
const authController = require('../controllers/auth.controller');
const { validateQuery } = require('../utils/validators');

// All query routes require authentication
router.use(authController.authenticate);

// Main search endpoint
router.post('/', validateQuery, queryController.search);

// Advanced search with filters
router.post('/advanced', validateQuery, queryController.advancedSearch);

// Search history
router.get('/history', queryController.getSearchHistory);
router.delete('/history/:historyId', queryController.deleteSearchHistory);

// Search suggestions
router.get('/suggestions', queryController.getSuggestions);

module.exports = router;
