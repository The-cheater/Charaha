const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
// const { validateSignup, validateLogin } = require('../utils/validators'); // Temporarily commented

// Local auth routes - these will be mounted at /auth/*
router.post('/signup', authController.signup);  // No validation temporarily
router.post('/login', authController.login);    // No validation temporarily
router.post('/logout', authController.logout);

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Protected routes (require authentication)
router.get('/me', authController.authenticate, authController.getProfile);
router.put('/me', authController.authenticate, authController.updateProfile);

module.exports = router;
