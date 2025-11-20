// File: server/models/User.js
// Purpose: User model with authentication, profile management, and security features
// Dependencies: mongoose, bcryptjs, jsonwebtoken, validator

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't include password in queries by default
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          // Allow empty or valid phone format
          return !v || /^\+?[\d\s\-()]+$/.test(v);
        },
        message: 'Please provide a valid phone number'
      }
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    emergencyContacts: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        phone: {
          type: String,
          required: true,
          trim: true
        },
        relationship: {
          type: String,
          trim: true
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
          validate: [validator.isEmail, 'Please provide a valid email']
        }
      }
    ],
    circles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Circle'
      }
    ],
    // Privacy settings
    privacySettings: {
      shareLocationWithCircles: {
        type: Boolean,
        default: true
      },
      allowCheckInNotifications: {
        type: Boolean,
        default: true
      },
      allowAlertNotifications: {
        type: Boolean,
        default: true
      },
      visibleToCircleMembers: {
        type: Boolean,
        default: true
      }
    },
    // Current location sharing status
    isLocationSharing: {
      type: Boolean,
      default: false
    },
    lastKnownLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      },
      address: {
        type: String,
        default: ''
      },
      timestamp: {
        type: Date,
        default: null
      }
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    // Refresh token for JWT refresh mechanism
    refreshToken: {
      type: String,
      select: false
    },
    // Security: Track failed login attempts
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    // Track last login
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create geospatial index for location queries
userSchema.index({ 'lastKnownLocation.coordinates': '2dsphere' });

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate JWT access token
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      name: this.name
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '15m'
    }
  );
};

// Generate JWT refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    {
      id: this._id
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    }
  );

  this.refreshToken = refreshToken;
  return refreshToken;
};

// Handle failed login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  if (this.failedLoginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { failedLoginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

// Update location
userSchema.methods.updateLocation = function(longitude, latitude, address) {
  this.lastKnownLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: address || '',
    timestamp: Date.now()
  };
  return this.save();
};

// Get public profile (safe data to send to clients)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    profilePhoto: this.profilePhoto,
    bio: this.bio,
    isLocationSharing: this.isLocationSharing,
    lastKnownLocation: this.privacySettings.shareLocationWithCircles
      ? this.lastKnownLocation
      : null,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
