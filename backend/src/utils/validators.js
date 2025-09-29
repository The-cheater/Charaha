const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateIngestRequest = [
  body('channelId')
    .notEmpty()
    .withMessage('Channel ID is required'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  handleValidationErrors
];

const validateGoogleDriveIngest = [
  body()
    .custom((value) => {
      const { fileIds, folderId } = value;
      if (!fileIds && !folderId) {
        throw new Error('Either fileIds array or folderId is required');
      }
      if (fileIds && !Array.isArray(fileIds)) {
        throw new Error('fileIds must be an array');
      }
      return true;
    }),
  body('fileIds')
    .optional()
    .isArray()
    .withMessage('fileIds must be an array'),
  body('fileIds.*')
    .optional()
    .isString()
    .withMessage('Each fileId must be a string'),
  body('folderId')
    .optional()
    .isString()
    .withMessage('folderId must be a string'),
  body('recursive')
    .optional()
    .isBoolean()
    .withMessage('recursive must be a boolean'),
  body('fileTypes')
    .optional()
    .isArray()
    .withMessage('fileTypes must be an array'),
  handleValidationErrors
];

const validateQueryRequest = [
  body('query')
    .notEmpty()
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Query is required and must be between 1-1000 characters'),
  body('topK')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('topK must be between 1 and 100'),
  body('source')
    .optional()
    .isIn(['all', 'slack', 'google-drive'])
    .withMessage('source must be all, slack, or google-drive'),
  body('minScore')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('minScore must be between 0 and 1'),
  handleValidationErrors
];

module.exports = {
  validateIngestRequest,
  validateGoogleDriveIngest,
  validateQueryRequest,
  handleValidationErrors
};
