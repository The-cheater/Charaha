const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false  // Important: Hide by default but allow explicit selection
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  roles: {
    type: [String],
    enum: ['user', 'admin'],
    default: ['user']
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  collection: 'users'
});

// CRITICAL: Remove any pre-save password hashing middleware
// The auth controller should handle password hashing explicitly

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Make sure password is selected
  if (!this.password) {
    const userWithPassword = await mongoose.model('User').findById(this._id).select('+password');
    this.password = userWithPassword.password;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user with password
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
