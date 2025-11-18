// File: server/controllers/userController.js
// Purpose: Handle user profile management and location updates
// Dependencies: User model, ErrorResponse

const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('circles', 'name description memberCount')
      .select('-password -refreshToken');

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, profilePhoto } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name.trim();
    if (phone !== undefined) fieldsToUpdate.phone = phone.trim();
    if (bio !== undefined) fieldsToUpdate.bio = bio.trim();
    if (profilePhoto !== undefined) fieldsToUpdate.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password -refreshToken');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update privacy settings
 * @route   PUT /api/users/privacy
 * @access  Private
 */
exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const {
      shareLocationWithCircles,
      allowCheckInNotifications,
      allowAlertNotifications,
      visibleToCircleMembers
    } = req.body;

    const user = await User.findById(req.user._id);

    // Update privacy settings
    if (shareLocationWithCircles !== undefined) {
      user.privacySettings.shareLocationWithCircles = shareLocationWithCircles;
    }
    if (allowCheckInNotifications !== undefined) {
      user.privacySettings.allowCheckInNotifications = allowCheckInNotifications;
    }
    if (allowAlertNotifications !== undefined) {
      user.privacySettings.allowAlertNotifications = allowAlertNotifications;
    }
    if (visibleToCircleMembers !== undefined) {
      user.privacySettings.visibleToCircleMembers = visibleToCircleMembers;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        privacySettings: user.privacySettings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user location
 * @route   PUT /api/users/location
 * @access  Private
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { longitude, latitude, address } = req.body;

    // Validate coordinates
    if (
      typeof longitude !== 'number' ||
      typeof latitude !== 'number' ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return next(new ErrorResponse('Invalid coordinates', 400));
    }

    const user = await User.findById(req.user._id);

    // Update location
    user.lastKnownLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
      address: address || '',
      timestamp: Date.now()
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: user.lastKnownLocation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle location sharing
 * @route   PUT /api/users/location/sharing
 * @access  Private
 */
exports.toggleLocationSharing = async (req, res, next) => {
  try {
    const { isSharing } = req.body;

    if (typeof isSharing !== 'boolean') {
      return next(new ErrorResponse('isSharing must be a boolean', 400));
    }

    const user = await User.findById(req.user._id);
    user.isLocationSharing = isSharing;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Location sharing ${isSharing ? 'enabled' : 'disabled'}`,
      data: {
        isLocationSharing: user.isLocationSharing
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add emergency contact
 * @route   POST /api/users/emergency-contacts
 * @access  Private
 */
exports.addEmergencyContact = async (req, res, next) => {
  try {
    const { name, phone, relationship, email } = req.body;

    if (!name || !phone) {
      return next(new ErrorResponse('Name and phone are required', 400));
    }

    const user = await User.findById(req.user._id);

    user.emergencyContacts.push({
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship?.trim() || '',
      email: email?.trim() || ''
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      data: {
        emergencyContacts: user.emergencyContacts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update emergency contact
 * @route   PUT /api/users/emergency-contacts/:contactId
 * @access  Private
 */
exports.updateEmergencyContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { name, phone, relationship, email } = req.body;

    const user = await User.findById(req.user._id);

    const contact = user.emergencyContacts.id(contactId);
    if (!contact) {
      return next(new ErrorResponse('Emergency contact not found', 404));
    }

    // Update fields
    if (name) contact.name = name.trim();
    if (phone) contact.phone = phone.trim();
    if (relationship !== undefined) contact.relationship = relationship.trim();
    if (email !== undefined) contact.email = email.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Emergency contact updated successfully',
      data: {
        emergencyContacts: user.emergencyContacts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete emergency contact
 * @route   DELETE /api/users/emergency-contacts/:contactId
 * @access  Private
 */
exports.deleteEmergencyContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const user = await User.findById(req.user._id);

    const contact = user.emergencyContacts.id(contactId);
    if (!contact) {
      return next(new ErrorResponse('Emergency contact not found', 404));
    }

    contact.remove();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Emergency contact deleted successfully',
      data: {
        emergencyContacts: user.emergencyContacts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID (for circle members to view each other)
 * @route   GET /api/users/:userId
 * @access  Private
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      'name email phone profilePhoto bio isLocationSharing lastKnownLocation createdAt'
    );

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Check if user allows visibility
    if (!user.privacySettings?.visibleToCircleMembers) {
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            profilePhoto: user.profilePhoto
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    next(error);
  }
};
