const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/mongodb/user.model');
const logger = require('../utils/logger');

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, and name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      roles: ['user']
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles
    };

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: userResponse,
        token
      }
    });

    logger.info(`New user registered: ${email}`);

  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles
    };

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

    logger.info(`User logged in: ${email}`);

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userResponse = {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      roles: req.user.roles,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    };

    res.json({
      status: 'success',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Name is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true }
    );

    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles
    };

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  signup,
  login,
  // Added minimal handlers to satisfy routes and avoid Express errors
  logout: (req, res) => {
    return res.json({ status: 'success', message: 'Logged out' });
  },
  googleAuth: (req, res) => {
    return res.status(501).json({ status: 'error', message: 'Google OAuth not implemented' });
  },
  googleCallback: (req, res) => {
    return res.status(501).json({ status: 'error', message: 'Google OAuth callback not implemented' });
  },
  authenticate,
  getProfile,
  updateProfile
};
