// File: server/controllers/circleController.js
// Purpose: Handle circle management operations - create, join, invite, manage members
// Dependencies: Circle model, User model, ErrorResponse

const Circle = require('../models/Circle');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get all circles for current user
 * @route   GET /api/circles
 * @access  Private
 */
exports.getMyCircles = async (req, res, next) => {
  try {
    const circles = await Circle.find({
      'members.user': req.user._id,
      'members.isActive': true,
      isActive: true
    })
      .populate('createdBy', 'name email profilePhoto')
      .populate('members.user', 'name email profilePhoto')
      .sort({ 'stats.lastActivityAt': -1 });

    res.status(200).json({
      success: true,
      count: circles.length,
      data: { circles }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single circle by ID
 * @route   GET /api/circles/:id
 * @access  Private
 */
exports.getCircleById = async (req, res, next) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate('createdBy', 'name email profilePhoto phone')
      .populate('members.user', 'name email profilePhoto phone isLocationSharing lastKnownLocation')
      .populate('pendingInvites.invitedBy', 'name email');

    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    // Check if user is a member
    if (!circle.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You are not authorized to view this circle', 403)
      );
    }

    res.status(200).json({
      success: true,
      data: { circle }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new circle
 * @route   POST /api/circles
 * @access  Private
 */
exports.createCircle = async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;

    // Create circle
    const circle = await Circle.create({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin',
          joinedAt: Date.now(),
          isActive: true
        }
      ],
      settings: settings || {}
    });

    // Generate invite code
    circle.generateInviteCode();
    await circle.save();

    // Add circle to user's circles
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { circles: circle._id }
    });

    // Populate creator info
    await circle.populate('createdBy', 'name email profilePhoto');
    await circle.populate('members.user', 'name email profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Circle created successfully',
      data: { circle }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update circle
 * @route   PUT /api/circles/:id
 * @access  Private (Admin only)
 */
exports.updateCircle = async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;

    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    // Check if user is admin
    if (!circle.isAdmin(req.user._id)) {
      return next(
        new ErrorResponse('Only circle admins can update circle settings', 403)
      );
    }

    // Update fields
    if (name) circle.name = name.trim();
    if (description !== undefined) circle.description = description.trim();
    if (settings) {
      circle.settings = { ...circle.settings, ...settings };
    }

    circle.stats.lastActivityAt = Date.now();
    await circle.save();

    res.status(200).json({
      success: true,
      message: 'Circle updated successfully',
      data: { circle }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/deactivate circle
 * @route   DELETE /api/circles/:id
 * @access  Private (Admin only)
 */
exports.deleteCircle = async (req, res, next) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    // Check if user is admin
    if (!circle.isAdmin(req.user._id)) {
      return next(
        new ErrorResponse('Only circle admins can delete circles', 403)
      );
    }

    // Soft delete - deactivate instead of removing
    circle.isActive = false;
    await circle.save();

    // Remove circle from all members
    await User.updateMany(
      { circles: circle._id },
      { $pull: { circles: circle._id } }
    );

    res.status(200).json({
      success: true,
      message: 'Circle deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Invite user to circle by email
 * @route   POST /api/circles/:id/invite
 * @access  Private
 */
exports.inviteToCircle = async (req, res, next) => {
  try {
    const { email } = req.body;

    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    // Check if user is a member and has permission to invite
    if (!circle.isMember(req.user._id)) {
      return next(new ErrorResponse('You are not a member of this circle', 403));
    }

    // Check if settings allow member invites or if user is admin
    if (!circle.settings.allowMemberInvites && !circle.isAdmin(req.user._id)) {
      return next(
        new ErrorResponse('Only admins can invite members to this circle', 403)
      );
    }

    // Check if email belongs to an existing user
    const invitedUser = await User.findOne({ email: email.toLowerCase() });

    if (invitedUser) {
      // Check if user is already a member
      if (circle.isMember(invitedUser._id)) {
        return next(new ErrorResponse('User is already a member of this circle', 400));
      }

      // Add user directly to circle
      await circle.addMember(invitedUser._id);
      await User.findByIdAndUpdate(invitedUser._id, {
        $addToSet: { circles: circle._id }
      });

      return res.status(200).json({
        success: true,
        message: 'User added to circle successfully',
        data: { circle }
      });
    }

    // User doesn't exist yet, add to pending invites
    try {
      await circle.addInvite(email.toLowerCase(), req.user._id);

      res.status(200).json({
        success: true,
        message: 'Invitation sent successfully',
        data: { circle }
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Join circle using invite code
 * @route   POST /api/circles/join/:inviteCode
 * @access  Private
 */
exports.joinCircleByCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;

    const circle = await Circle.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!circle) {
      return next(new ErrorResponse('Invalid invite code', 404));
    }

    // Check if invite code is valid
    if (!circle.isInviteCodeValid()) {
      return next(new ErrorResponse('Invite code has expired', 400));
    }

    // Check if user is already a member
    if (circle.isMember(req.user._id)) {
      return next(new ErrorResponse('You are already a member of this circle', 400));
    }

    // Add user to circle
    try {
      await circle.addMember(req.user._id);
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { circles: circle._id }
      });

      await circle.populate('createdBy', 'name email profilePhoto');
      await circle.populate('members.user', 'name email profilePhoto');

      res.status(200).json({
        success: true,
        message: 'Successfully joined circle',
        data: { circle }
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Leave circle
 * @route   POST /api/circles/:id/leave
 * @access  Private
 */
exports.leaveCircle = async (req, res, next) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    // Check if user is a member
    if (!circle.isMember(req.user._id)) {
      return next(new ErrorResponse('You are not a member of this circle', 400));
    }

    // Remove user from circle
    try {
      await circle.removeMember(req.user._id);
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { circles: circle._id }
      });

      res.status(200).json({
        success: true,
        message: 'Successfully left circle'
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from circle
 * @route   DELETE /api/circles/:id/members/:userId
 * @access  Private (Admin only)
 */
exports.removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const circle = await Circle.findById(id);

    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    // Check if user is admin
    if (!circle.isAdmin(req.user._id)) {
      return next(
        new ErrorResponse('Only circle admins can remove members', 403)
      );
    }

    // Cannot remove yourself (use leave instead)
    if (userId === req.user._id.toString()) {
      return next(
        new ErrorResponse('Use leave endpoint to remove yourself from circle', 400)
      );
    }

    // Remove member
    try {
      await circle.removeMember(userId);
      await User.findByIdAndUpdate(userId, {
        $pull: { circles: circle._id }
      });

      res.status(200).json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update member role
 * @route   PUT /api/circles/:id/members/:userId/role
 * @access  Private (Admin only)
 */
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      return next(new ErrorResponse('Invalid role. Must be admin or member', 400));
    }

    const circle = await Circle.findById(id);

    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    // Check if user is admin
    if (!circle.isAdmin(req.user._id)) {
      return next(
        new ErrorResponse('Only circle admins can update member roles', 403)
      );
    }

    // Update role
    try {
      await circle.updateMemberRole(userId, role);

      res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        data: { circle }
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Regenerate invite code
 * @route   POST /api/circles/:id/regenerate-code
 * @access  Private (Admin only)
 */
exports.regenerateInviteCode = async (req, res, next) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    // Check if user is admin
    if (!circle.isAdmin(req.user._id)) {
      return next(
        new ErrorResponse('Only circle admins can regenerate invite code', 403)
      );
    }

    // Generate new invite code
    circle.generateInviteCode();
    await circle.save();

    res.status(200).json({
      success: true,
      message: 'Invite code regenerated successfully',
      data: {
        inviteCode: circle.inviteCode,
        inviteCodeExpiry: circle.inviteCodeExpiry
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get circle members
 * @route   GET /api/circles/:id/members
 * @access  Private
 */
exports.getCircleMembers = async (req, res, next) => {
  try {
    const circle = await Circle.findById(req.params.id).populate(
      'members.user',
      'name email profilePhoto phone isLocationSharing lastKnownLocation'
    );

    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    // Check if user is a member
    if (!circle.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You are not authorized to view circle members', 403)
      );
    }

    // Get only active members
    const activeMembers = circle.getActiveMembers();

    res.status(200).json({
      success: true,
      count: activeMembers.length,
      data: { members: activeMembers }
    });
  } catch (error) {
    next(error);
  }
};
