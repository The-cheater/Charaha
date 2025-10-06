const { body, query, param } = require('express-validator');

// Auth validators
const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, lowercase letter, number and special character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// ✅ UPDATED: More flexible Slack validators for testing
const validateSlackIngest = [
  body('channelId')
    .optional()  // Made optional for testing
    .matches(/^[C][0-9A-Z]+$/)
    .withMessage('Invalid Slack channel ID format'),
  body('channel')
    .optional()  // Accept both channelId and channel
    .isLength({ min: 1 })
    .withMessage('Channel cannot be empty'),
  body('text')
    .optional()  // Allow manual text input
    .isLength({ min: 1 })
    .withMessage('Text content is required'),
  body('user')
    .optional()
    .isLength({ min: 1 })
    .withMessage('User cannot be empty'),
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be in ISO 8601 format'),
  body('since')
    .optional()
    .isISO8601()
    .withMessage('Since date must be in ISO 8601 format'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000')
];

const validateSlackBulkIngest = [
  body('channelIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Channel IDs must be an array with 1-50 items'),
  body('channelIds.*')
    .matches(/^[C][0-9A-Z]+$/)
    .withMessage('Invalid Slack channel ID format'),
  body('since')
    .optional()
    .isISO8601()
    .withMessage('Since date must be in ISO 8601 format'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000')
];

const validateSlackSearch = [
  query('query')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Query must be between 1 and 500 characters'),
  query('channelId')
    .optional()
    .matches(/^[C][0-9A-Z]+$/)
    .withMessage('Invalid Slack channel ID format'),
  query('userId')
    .optional()
    .matches(/^[U][0-9A-Z]+$/)
    .withMessage('Invalid Slack user ID format'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format')
];

// Drive validators (placeholders)
const validateDriveIngest = [
  body('fileId')
    .optional()
    .isLength({ min: 1 })
    .withMessage('File ID cannot be empty'),
  body('folderId')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Folder ID cannot be empty'),
  body('since')
    .optional()
    .isISO8601()
    .withMessage('Since date must be in ISO 8601 format')
];

// ✅ UPDATED: More flexible query validators
const validateSearch = [
  body('query')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Query must be between 1 and 500 characters'),
  body('topK')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('TopK must be between 1 and 100'),
  body('source')
    .optional()  // Make source optional
    .isIn(['slack', 'google-drive', 'all'])
    .withMessage('Source must be slack, google-drive, or all'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object')
];

module.exports = {
  validateSignup,
  validateLogin,
  validateSlackIngest,
  validateSlackBulkIngest,
  validateSlackSearch,
  validateDriveIngest,
  validateSearch
};
