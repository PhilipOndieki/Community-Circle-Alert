// File: server/models/Circle.js
// Purpose: Circle model for managing safety groups with members, invitations, and roles
// Dependencies: mongoose, crypto (for invite codes)

const mongoose = require('mongoose');
const crypto = require('crypto');

const circleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Circle name is required'],
      trim: true,
      minlength: [2, 'Circle name must be at least 2 characters'],
      maxlength: [100, 'Circle name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    // Circle creator/admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Members with roles
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        // Track if member has acknowledged being part of circle
        isActive: {
          type: Boolean,
          default: true
        }
      }
    ],
    // Pending invitations
    pendingInvites: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        invitedAt: {
          type: Date,
          default: Date.now
        },
        // Expires after 7 days
        expiresAt: {
          type: Date,
          default: () => Date.now() + 7 * 24 * 60 * 60 * 1000
        }
      }
    ],
    // Invite code for easy joining
    inviteCode: {
      type: String,
      unique: true,
      sparse: true
    },
    inviteCodeExpiry: {
      type: Date
    },
    // Circle settings
    settings: {
      requireApproval: {
        type: Boolean,
        default: false
      },
      allowMemberInvites: {
        type: Boolean,
        default: true
      },
      maxMembers: {
        type: Number,
        default: 50,
        min: 2,
        max: 100
      },
      autoShareLocation: {
        type: Boolean,
        default: true
      }
    },
    // Circle status
    isActive: {
      type: Boolean,
      default: true
    },
    // Statistics
    stats: {
      totalAlerts: {
        type: Number,
        default: 0
      },
      totalCheckIns: {
        type: Number,
        default: 0
      },
      lastActivityAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient queries
circleSchema.index({ createdBy: 1 });
circleSchema.index({ 'members.user': 1 });
circleSchema.index({ inviteCode: 1 });

// Virtual for member count
circleSchema.virtual('memberCount').get(function() {
  return this.members.filter(m => m.isActive).length;
});

// Generate unique invite code
circleSchema.methods.generateInviteCode = function() {
  // Generate 8-character alphanumeric code
  this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  // Code expires in 30 days
  this.inviteCodeExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  return this.inviteCode;
};

// Check if invite code is valid
circleSchema.methods.isInviteCodeValid = function() {
  if (!this.inviteCode || !this.inviteCodeExpiry) {
    return false;
  }
  return this.inviteCodeExpiry > Date.now();
};

// Add member to circle
circleSchema.methods.addMember = function(userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(
    m => m.user.toString() === userId.toString()
  );

  if (existingMember) {
    // Reactivate if inactive
    if (!existingMember.isActive) {
      existingMember.isActive = true;
      existingMember.joinedAt = Date.now();
    }
    return this.save();
  }

  // Check member limit
  if (this.memberCount >= this.settings.maxMembers) {
    throw new Error('Circle has reached maximum member limit');
  }

  // Add new member
  this.members.push({
    user: userId,
    role,
    joinedAt: Date.now(),
    isActive: true
  });

  this.stats.lastActivityAt = Date.now();
  return this.save();
};

// Remove member from circle
circleSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(
    m => m.user.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new Error('User is not a member of this circle');
  }

  // Prevent removing the last admin
  const member = this.members[memberIndex];
  if (member.role === 'admin') {
    const adminCount = this.members.filter(m => m.role === 'admin' && m.isActive).length;
    if (adminCount <= 1) {
      throw new Error('Cannot remove the last admin from the circle');
    }
  }

  // Soft delete - set inactive instead of removing
  this.members[memberIndex].isActive = false;
  this.stats.lastActivityAt = Date.now();
  return this.save();
};

// Update member role
circleSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString() && m.isActive
  );

  if (!member) {
    throw new Error('User is not an active member of this circle');
  }

  // Prevent demoting the last admin
  if (member.role === 'admin' && newRole !== 'admin') {
    const adminCount = this.members.filter(m => m.role === 'admin' && m.isActive).length;
    if (adminCount <= 1) {
      throw new Error('Cannot demote the last admin');
    }
  }

  member.role = newRole;
  this.stats.lastActivityAt = Date.now();
  return this.save();
};

// Check if user is member
circleSchema.methods.isMember = function(userId) {
  return this.members.some(
    m => m.user.toString() === userId.toString() && m.isActive
  );
};

// Check if user is admin
circleSchema.methods.isAdmin = function(userId) {
  return this.members.some(
    m =>
      m.user.toString() === userId.toString() &&
      m.role === 'admin' &&
      m.isActive
  );
};

// Add pending invite
circleSchema.methods.addInvite = function(email, invitedBy) {
  // Check if email is already invited
  const existingInvite = this.pendingInvites.find(
    invite => invite.email === email && invite.expiresAt > Date.now()
  );

  if (existingInvite) {
    throw new Error('User has already been invited');
  }

  // Check if user is already a member
  // This will be checked at controller level with User lookup

  this.pendingInvites.push({
    email,
    invitedBy,
    invitedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return this.save();
};

// Remove expired invites
circleSchema.methods.cleanExpiredInvites = function() {
  this.pendingInvites = this.pendingInvites.filter(
    invite => invite.expiresAt > Date.now()
  );
  return this.save();
};

// Increment alert count
circleSchema.methods.incrementAlerts = function() {
  this.stats.totalAlerts += 1;
  this.stats.lastActivityAt = Date.now();
  return this.save();
};

// Increment check-in count
circleSchema.methods.incrementCheckIns = function() {
  this.stats.totalCheckIns += 1;
  this.stats.lastActivityAt = Date.now();
  return this.save();
};

// Get active members only
circleSchema.methods.getActiveMembers = function() {
  return this.members.filter(m => m.isActive);
};

const Circle = mongoose.model('Circle', circleSchema);

module.exports = Circle;
