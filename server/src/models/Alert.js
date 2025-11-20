// File: server/models/Alert.js
// Purpose: Alert model for managing panic alerts and emergency notifications
// Dependencies: mongoose

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    // User who triggered the alert
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who triggered alert is required']
    },
    // Circle to notify
    circle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Circle',
      required: [true, 'Circle is required for alert']
    },
    // Alert type
    type: {
      type: String,
      enum: ['panic', 'check-in-overdue', 'sos', 'location-sharing', 'manual'],
      default: 'panic'
    },
    // Alert severity
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'critical'
    },
    // Alert title
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    // Alert message/description
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: ''
    },
    // Location where alert was triggered
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
      },
      accuracy: {
        type: Number, // Accuracy in meters
        default: null
      }
    },
    // Alert status
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved', 'false-alarm', 'cancelled'],
      default: 'active'
    },
    // Members who have acknowledged the alert
    acknowledgedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        acknowledgedAt: {
          type: Date,
          default: Date.now
        },
        response: {
          type: String,
          enum: ['on-my-way', 'contacted-authorities', 'monitoring', 'other'],
          default: 'monitoring'
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [500, 'Notes cannot exceed 500 characters']
        }
      }
    ],
    // Resolution details
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
    },
    resolutionStatus: {
      type: String,
      enum: ['safe', 'help-arrived', 'false-alarm', 'other'],
      default: null
    },
    // Related check-in (if alert is triggered from overdue check-in)
    relatedCheckIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CheckIn'
    },
    // Notification tracking
    notifications: {
      sentTo: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          sentAt: {
            type: Date,
            default: Date.now
          },
          channel: {
            type: String,
            enum: ['socket', 'email', 'sms', 'push'],
            default: 'socket'
          },
          status: {
            type: String,
            enum: ['sent', 'delivered', 'failed'],
            default: 'sent'
          }
        }
      ],
      failedNotifications: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          channel: String,
          error: String,
          attemptedAt: {
            type: Date,
            default: Date.now
          }
        }
      ]
    },
    // Activity log for the alert
    activityLog: [
      {
        action: {
          type: String,
          enum: [
            'created',
            'acknowledged',
            'escalated',
            'resolved',
            'cancelled',
            'updated'
          ],
          required: true
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        details: {
          type: String,
          trim: true
        }
      }
    ],
    // Priority and urgency
    priority: {
      type: Number,
      min: 1,
      max: 5,
      default: 5 // Highest priority for panic alerts
    },
    // Auto-escalation settings
    autoEscalate: {
      enabled: {
        type: Boolean,
        default: true
      },
      escalateAfterMinutes: {
        type: Number,
        default: 5
      },
      escalated: {
        type: Boolean,
        default: false
      },
      escalatedAt: {
        type: Date
      }
    },
    // Metadata
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient queries
alertSchema.index({ triggeredBy: 1, status: 1 });
alertSchema.index({ circle: 1, status: 1, createdAt: -1 });
alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for alert duration
alertSchema.virtual('duration').get(function() {
  if (this.resolvedAt) {
    return this.resolvedAt - this.createdAt;
  }
  return Date.now() - this.createdAt;
});

// Virtual for acknowledgment rate
alertSchema.virtual('acknowledgmentRate').get(function() {
  // This would need circle member count, calculated at controller level
  return this.acknowledgedBy.length;
});

// Virtual for time since creation
alertSchema.virtual('timeSinceCreation').get(function() {
  return Date.now() - this.createdAt;
});

// Method to acknowledge alert
alertSchema.methods.acknowledge = function(userId, response = 'monitoring', notes = '') {
  // Check if user already acknowledged
  const existingAck = this.acknowledgedBy.find(
    ack => ack.user.toString() === userId.toString()
  );

  if (existingAck) {
    // Update existing acknowledgment
    existingAck.acknowledgedAt = Date.now();
    existingAck.response = response;
    existingAck.notes = notes;
  } else {
    // Add new acknowledgment
    this.acknowledgedBy.push({
      user: userId,
      acknowledgedAt: Date.now(),
      response,
      notes
    });
  }

  // Update status to acknowledged if not already resolved
  if (this.status === 'active') {
    this.status = 'acknowledged';
  }

  // Add to activity log
  this.activityLog.push({
    action: 'acknowledged',
    performedBy: userId,
    timestamp: Date.now(),
    details: `Acknowledged with response: ${response}`
  });

  return this.save();
};

// Method to resolve alert
alertSchema.methods.resolve = function(
  userId,
  resolutionStatus = 'safe',
  notes = ''
) {
  if (this.status === 'resolved') {
    throw new Error('Alert is already resolved');
  }

  this.status = 'resolved';
  this.resolvedAt = Date.now();
  this.resolvedBy = userId;
  this.resolutionStatus = resolutionStatus;
  this.resolutionNotes = notes;

  // Add to activity log
  this.activityLog.push({
    action: 'resolved',
    performedBy: userId,
    timestamp: Date.now(),
    details: `Resolved as: ${resolutionStatus}`
  });

  return this.save();
};

// Method to cancel alert
alertSchema.methods.cancel = function(userId, reason = '') {
  if (this.status === 'resolved') {
    throw new Error('Cannot cancel a resolved alert');
  }

  this.status = 'cancelled';
  this.resolvedAt = Date.now();
  this.resolvedBy = userId;
  this.resolutionNotes = reason;

  // Add to activity log
  this.activityLog.push({
    action: 'cancelled',
    performedBy: userId,
    timestamp: Date.now(),
    details: reason
  });

  return this.save();
};

// Method to mark as false alarm
alertSchema.methods.markFalseAlarm = function(userId, reason = '') {
  this.status = 'false-alarm';
  this.resolvedAt = Date.now();
  this.resolvedBy = userId;
  this.resolutionStatus = 'false-alarm';
  this.resolutionNotes = reason;

  // Add to activity log
  this.activityLog.push({
    action: 'resolved',
    performedBy: userId,
    timestamp: Date.now(),
    details: 'Marked as false alarm'
  });

  return this.save();
};

// Method to escalate alert
alertSchema.methods.escalate = function() {
  if (this.autoEscalate.escalated) {
    return Promise.resolve(this);
  }

  this.autoEscalate.escalated = true;
  this.autoEscalate.escalatedAt = Date.now();
  this.priority = 5; // Maximum priority

  // Add to activity log
  this.activityLog.push({
    action: 'escalated',
    timestamp: Date.now(),
    details: 'Auto-escalated due to no response'
  });

  return this.save();
};

// Method to add notification record
alertSchema.methods.addNotification = function(
  userId,
  channel = 'socket',
  status = 'sent'
) {
  this.notifications.sentTo.push({
    user: userId,
    sentAt: Date.now(),
    channel,
    status
  });

  return this.save();
};

// Method to record failed notification
alertSchema.methods.recordFailedNotification = function(
  userId,
  channel,
  error
) {
  this.notifications.failedNotifications.push({
    user: userId,
    channel,
    error,
    attemptedAt: Date.now()
  });

  return this.save();
};

// Static method to find active alerts for a circle
alertSchema.statics.findActiveByCircle = function(circleId) {
  return this.find({
    circle: circleId,
    status: { $in: ['active', 'acknowledged'] },
    isDeleted: false
  })
    .populate('triggeredBy', 'name email profilePhoto')
    .populate('acknowledgedBy.user', 'name email profilePhoto')
    .sort({ createdAt: -1 });
};

// Static method to find alerts for a user
alertSchema.statics.findByUser = function(userId, status = null) {
  const query = {
    triggeredBy: userId,
    isDeleted: false
  };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('circle', 'name')
    .sort({ createdAt: -1 });
};

// Static method to find alerts needing escalation
alertSchema.statics.findNeedingEscalation = function() {
  const escalationTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago

  return this.find({
    status: 'active',
    'autoEscalate.enabled': true,
    'autoEscalate.escalated': false,
    createdAt: { $lt: escalationTime },
    isDeleted: false
  }).populate('triggeredBy circle');
};

// Pre-save middleware to initialize activity log
alertSchema.pre('save', function(next) {
  if (this.isNew) {
    this.activityLog.push({
      action: 'created',
      performedBy: this.triggeredBy,
      timestamp: this.createdAt,
      details: `Alert created: ${this.type}`
    });
  }
  next();
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
