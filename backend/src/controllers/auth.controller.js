const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/mongodb/user.model');
const googleService = require('../services/google.service');
const logger = require('../utils/logger');

class AuthController {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  // Signup
  async signup(req, res, next) {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'User already exists with this email'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        roles: ['user']
      });

      // Generate token
      const token = this.generateToken(user._id);

      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            roles: user.roles
          },
          token
        }
      });
    } catch (error) {
      logger.error('Signup error:', error);
      next(error);
    }
  }

  // Login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user and include password
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      // Generate token
      const token = this.generateToken(user._id);

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            roles: user.roles
          },
          token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  // Google OAuth
  async googleAuth(req, res) {
    const authUrl = googleService.getAuthUrl();
    res.redirect(authUrl);
  }

  // Google OAuth callback
  async googleCallback(req, res, next) {
    try {
      const { code } = req.query;
      const googleUser = await googleService.getGoogleUser(code);

      let user = await User.findOne({ email: googleUser.email });
      
      if (!user) {
        user = await User.create({
          email: googleUser.email,
          name: googleUser.name,
          oauth: {
            google: {
              id: googleUser.id,
              accessToken: googleUser.accessToken,
              refreshToken: googleUser.refreshToken
            }
          },
          roles: ['user']
        });
      } else {
        // Update OAuth tokens
        user.oauth.google = {
          id: googleUser.id,
          accessToken: googleUser.accessToken,
          refreshToken: googleUser.refreshToken
        };
        await user.save();
      }

      const token = this.generateToken(user._id);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      logger.error('Google OAuth error:', error);
      next(error);
    }
  }

  // Middleware to authenticate requests
  async authenticate(req, res, next) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Access denied. No token provided.'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(401).json({
        status: 'error',
        message: 'Invalid token.'
      });
    }
  }

  // Get user profile
  async getProfile(req, res, next) {
    try {
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            roles: req.user.roles,
            createdAt: req.user.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const { name } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            roles: user.roles
          }
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }

  // Logout
  async logout(req, res) {
    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  }
}

module.exports = new AuthController();
