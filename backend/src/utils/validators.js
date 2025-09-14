const { body, query, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation.middleware');

const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase, uppercase, and numeric character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  validateRequest
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest
];

const validateQuery = [
  body('query')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Query must be between 1 and 500 characters'),
  body('topK')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('topK must be between 1 and 20'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  validateRequest
];

const validateSlackIngest = [
  body('channel')
    .matches(/^[C][A-Z0-9]{8,}$/)
    .withMessage('Invalid Slack channel ID format'),
  body('since')
    .optional()
    .isISO8601()
    .withMessage('Since must be a valid ISO date'),
  body('workspace')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workspace name must be between 1 and 100 characters'),
  validateRequest
];

const validateDriveIngest = [
  body('fileId')
    .optional()
    .matches(/^[a-zA-Z0-9-_]{25,}$/)
    .withMessage('Invalid Google Drive file ID format'),
  body('folderId')
    .optional()
    .matches(/^[a-zA-Z0-9-_]{25,}$/)
    .withMessage('Invalid Google Drive folder ID format'),
  body('since')
    .optional()
    .isISO8601()
    .withMessage('Since must be a valid ISO date'),
  validateRequest
];

module.exports = {
  validateSignup,
  validateLogin,
  validateQuery,
  validateSlackIngest,
  validateDriveIngest
};
