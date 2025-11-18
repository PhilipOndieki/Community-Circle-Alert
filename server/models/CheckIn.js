// File: server/models/CheckIn.js
// Purpose: CheckIn model for tracking user safety check-ins with location and time
// Dependencies: mongoose

const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for check-in']
    },
    circle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Circle',
      required: [true, 'Circle is required for check-in']
    },
    // Check-in location
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates are required']
      },
      address: {
        type: String,
        trim: true,
        default: ''
      }
    },
    // Expected return time
    expectedReturnTime: {
      type: Date,
      required: [true, 'Expected return time is required'],
      validate: {
        validator: function(value) {
          return value > Date.now();
        },
        message: 'Expected return time must be in the future'
      }
    },
    // Optional notes from user
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: ''
    },
    // Check-in status
    status: {
      type: String,
      enum: ['active', 'completed', 'overdue', 'cancelled'],
      default: 'active'
    },
    // Completion details
    completedAt: {
      type: Date
    },
    completionNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Completion notes cannot exceed 500 characters']
    },
    // Track if user completed early or late
    completionStatus: {
      type: String,
      enum: ['on-time', 'early', 'late', 'auto-completed'],
      default: null
    },
    // Acknowledgments from circle members
    acknowledgments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        acknowledgedAt: {
          type: Date,
          default: Date.now
        },
        message: {
          type: String,
          trim: true,
          maxlength: [200, 'Message cannot exceed 200 characters']
        }
      }
    ],
    // Track location updates during check-in
    locationHistory: [
      {
        coordinates: {
          type: [Number] // [longitude, latitude]
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // Notification settings for this check-in
    notifications: {
      notifyOnStart: {
        type: Boolean,
        default: true
      },
      notifyOnComplete: {
        type: Boolean,
        default: true
      },
      notifyIfOverdue: {
        type: Boolean,
        default: true
      },
      overdueNotificationSent: {
        type: Boolean,
        default: false
      }
    },
    // Metadata
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient queries
checkInSchema.index({ user: 1, status: 1 });
checkInSchema.index({ circle: 1, status: 1 });
checkInSchema.index({ expectedReturnTime: 1, status: 1 });
checkInSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for checking if check-in is overdue
checkInSchema.virtual('isOverdue').get(function() {
  return (
    this.status === 'active' &&
    this.expectedReturnTime &&
    this.expectedReturnTime < Date.now()
  );
});

// Virtual for time remaining
checkInSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') {
    return 0;
  }
  const remaining = this.expectedReturnTime - Date.now();
  return Math.max(0, remaining);
});

// Virtual for duration
checkInSchema.virtual('duration').get(function() {
  if (!this.completedAt) {
    return null;
  }
  return this.completedAt - this.createdAt;
});

// Check if check-in is overdue and update status
checkInSchema.methods.checkOverdue = function() {
  if (this.status === 'active' && this.expectedReturnTime < Date.now()) {
    this.status = 'overdue';
    return this.save();
  }
  return Promise.resolve(this);
};

// Complete check-in
checkInSchema.methods.complete = function(notes = '') {
  if (this.status !== 'active' && this.status !== 'overdue') {
    throw new Error('Only active or overdue check-ins can be completed');
  }

  const now = Date.now();
  this.status = 'completed';
  this.completedAt = now;
  this.completionNotes = notes;

  // Determine completion status
  if (this.expectedReturnTime > now) {
    this.completionStatus = 'early';
  } else if (this.expectedReturnTime.getTime() === now) {
    this.completionStatus = 'on-time';
  } else {
    this.completionStatus = 'late';
  }

  return this.save();
};

// Cancel check-in
checkInSchema.methods.cancel = function() {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel a completed check-in');
  }

  this.status = 'cancelled';
  return this.save();
};

// Add acknowledgment from circle member
checkInSchema.methods.addAcknowledgment = function(userId, message = '') {
  // Check if user already acknowledged
  const existingAck = this.acknowledgments.find(
    ack => ack.user.toString() === userId.toString()
  );

  if (existingAck) {
    // Update existing acknowledgment
    existingAck.acknowledgedAt = Date.now();
    existingAck.message = message;
  } else {
    // Add new acknowledgment
    this.acknowledgments.push({
      user: userId,
      acknowledgedAt: Date.now(),
      message
    });
  }

  return this.save();
};

// Update location during active check-in
checkInSchema.methods.updateLocation = function(longitude, latitude) {
  if (this.status !== 'active') {
    throw new Error('Can only update location for active check-ins');
  }

  // Update current location
  this.location.coordinates = [longitude, latitude];

  // Add to location history
  this.locationHistory.push({
    coordinates: [longitude, latitude],
    timestamp: Date.now()
  });

  // Limit location history to last 50 entries to prevent document bloat
  if (this.locationHistory.length > 50) {
    this.locationHistory = this.locationHistory.slice(-50);
  }

  return this.save();
};

// Static method to find overdue check-ins
checkInSchema.statics.findOverdue = function() {
  return this.find({
    status: 'active',
    expectedReturnTime: { $lt: Date.now() }
  }).populate('user circle');
};

// Static method to find active check-ins for a user
checkInSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    user: userId,
    status: 'active',
    isDeleted: false
  })
    .populate('circle')
    .sort({ expectedReturnTime: 1 });
};

// Static method to find active check-ins in a circle
checkInSchema.statics.findActiveByCircle = function(circleId) {
  return this.find({
    circle: circleId,
    status: 'active',
    isDeleted: false
  })
    .populate('user', 'name email profilePhoto')
    .sort({ expectedReturnTime: 1 });
};

// Pre-save middleware to update status if overdue
checkInSchema.pre('save', function(next) {
  if (
    this.status === 'active' &&
    this.expectedReturnTime &&
    this.expectedReturnTime < Date.now()
  ) {
    this.status = 'overdue';
  }
  next();
});

const CheckIn = mongoose.model('CheckIn', checkInSchema);

module.exports = CheckIn;
