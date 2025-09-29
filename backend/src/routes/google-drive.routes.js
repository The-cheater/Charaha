const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const GoogleDriveService = require('../services/google-drive.service');
const googleDriveController = require('../controllers/google-drive.controller');
const { validateGoogleDriveIngest } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize Google Drive Service
const googleDriveService = new GoogleDriveService();

// All routes require authentication
router.use(authenticate);

// 🧪 Test route with real API connection test
router.get('/test', async (req, res) => {
  try {
    let connectionTest = { connected: false, mode: 'mock' };
    
    if (googleDriveService.isApiConfigured()) {
      try {
        connectionTest = await googleDriveService.testConnection();
        connectionTest.mode = 'real';
      } catch (error) {
        connectionTest = { 
          connected: false, 
          mode: 'real', 
          error: error.message 
        };
      }
    }

    res.json({
      status: 'success',
      message: `Google Drive routes working in ${connectionTest.mode} mode! 🚀`,
      timestamp: new Date().toISOString(),
      user: {
        id: req.user?.id || req.user?._id,
        email: req.user?.email
      },
      googleDrive: connectionTest,
      endpoints: {
        test: '/api/google-drive/test',
        folders: '/api/google-drive/folders',
        files: '/api/google-drive/files/search',
        ingest: '/api/google-drive/ingest',
        status: '/api/google-drive/status'
      }
    });
  } catch (error) {
    logger.error('Google Drive test failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 📁 Folders routes
router.get('/folders', googleDriveController.getFolders);

// 🔍 File search routes
router.get('/files/search', googleDriveController.searchFiles);

// 🔧 File preview route
router.get('/files/:fileId/preview', googleDriveController.getFilePreview);

// 📥 Ingestion routes
router.post('/ingest', validateGoogleDriveIngest, googleDriveController.ingestFiles);

// 📊 Status route
router.get('/status', (req, res) => {
  const isConfigured = googleDriveService.isApiConfigured();
  
  res.json({
    status: 'success',
    message: 'Google Drive integration status',
    data: {
      configured: isConfigured,
      mode: isConfigured ? 'real' : 'mock',
      reason: isConfigured ? 
        'Google Drive API properly configured' : 
        'Google Drive API credentials not configured',
      required_env_vars: [
        'GOOGLE_PROJECT_ID',
        'GOOGLE_PRIVATE_KEY_ID',
        'GOOGLE_PRIVATE_KEY',
        'GOOGLE_CLIENT_EMAIL',
        'GOOGLE_CLIENT_ID'
      ],
      current_env_status: {
        GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
        GOOGLE_PRIVATE_KEY_ID: !!process.env.GOOGLE_PRIVATE_KEY_ID,
        GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
        GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID
      },
      capabilities: {
        folders: isConfigured ? 'real' : 'mock',
        files: isConfigured ? 'real' : 'mock',
        search: isConfigured ? 'real' : 'mock',
        text_extraction: isConfigured ? 'real' : 'mock',
        ingestion: isConfigured ? 'enabled' : 'mock'
      }
    }
  });
});

module.exports = router;
