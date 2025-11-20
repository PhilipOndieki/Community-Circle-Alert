// File: server/controllers/checkInController.js
// Purpose: Handle check-in operations - create, complete, update location
// Dependencies: CheckIn model, Circle model, User model, ErrorResponse

const CheckIn = require('../models/CheckIn');
const Circle = require('../models/Circle');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get all check-ins for current user
 * @route   GET /api/checkins
 * @access  Private
 */
exports.getMyCheckIns = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = {
      user: req.user._id,
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    const checkIns = await CheckIn.find(query)
      .populate('circle', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: checkIns.length,
      data: { checkIns }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active check-ins for current user
 * @route   GET /api/checkins/active
 * @access  Private
 */
exports.getMyActiveCheckIns = async (req, res, next) => {
  try {
    const checkIns = await CheckIn.findActiveByUser(req.user._id);

    res.status(200).json({
      success: true,
      count: checkIns.length,
      data: { checkIns }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get check-ins for a specific circle
 * @route   GET /api/checkins/circle/:circleId
 * @access  Private
 */
exports.getCircleCheckIns = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const { status } = req.query;

    // Verify user is member of circle
    const circle = await Circle.findById(circleId);
    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    if (!circle.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You are not authorized to view check-ins for this circle', 403)
      );
    }

    const query = {
      circle: circleId,
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    const checkIns = await CheckIn.find(query)
      .populate('user', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: checkIns.length,
      data: { checkIns }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active check-ins for a circle
 * @route   GET /api/checkins/circle/:circleId/active
 * @access  Private
 */
exports.getCircleActiveCheckIns = async (req, res, next) => {
  try {
    const { circleId } = req.params;

    // Verify user is member of circle
    const circle = await Circle.findById(circleId);
    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    if (!circle.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You are not authorized to view check-ins for this circle', 403)
      );
    }

    const checkIns = await CheckIn.findActiveByCircle(circleId);

    res.status(200).json({
      success: true,
      count: checkIns.length,
      data: { checkIns }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single check-in by ID
 * @route   GET /api/checkins/:id
 * @access  Private
 */
exports.getCheckInById = async (req, res, next) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id)
      .populate('user', 'name email profilePhoto phone')
      .populate('circle', 'name')
      .populate('acknowledgments.user', 'name profilePhoto');

    if (!checkIn) {
      return next(new ErrorResponse('Check-in not found', 404));
    }

    // Verify user is either the check-in creator or a circle member
    const circle = await Circle.findById(checkIn.circle);
    if (
      checkIn.user._id.toString() !== req.user._id.toString() &&
      !circle.isMember(req.user._id)
    ) {
      return next(
        new ErrorResponse('You are not authorized to view this check-in', 403)
      );
    }

    res.status(200).json({
      success: true,
      data: { checkIn }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new check-in
 * @route   POST /api/checkins
 * @access  Private
 */
exports.createCheckIn = async (req, res, next) => {
  try {
    const { circle, location, expectedReturnTime, notes } = req.body;

    // Verify circle exists and user is member
    const circleDoc = await Circle.findById(circle);
    if (!circleDoc) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    if (!circleDoc.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You must be a member of the circle to create a check-in', 403)
      );
    }

    // Create check-in
    const checkIn = await CheckIn.create({
      user: req.user._id,
      circle,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address || ''
      },
      expectedReturnTime,
      notes: notes || '',
      status: 'active'
    });

    // Increment circle check-in count
    await circleDoc.incrementCheckIns();

    // Populate user and circle info
    await checkIn.populate('user', 'name email profilePhoto');
    await checkIn.populate('circle', 'name');

    res.status(201).json({
      success: true,
      message: 'Check-in created successfully',
      data: { checkIn }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete check-in
 * @route   PUT /api/checkins/:id/complete
 * @access  Private
 */
exports.completeCheckIn = async (req, res, next) => {
  try {
    const { notes } = req.body;

    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return next(new ErrorResponse('Check-in not found', 404));
    }

    // Verify user owns this check-in
    if (checkIn.user.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse('You are not authorized to complete this check-in', 403)
      );
    }

    // Complete check-in
    try {
      await checkIn.complete(notes);

      res.status(200).json({
        success: true,
        message: 'Check-in completed successfully',
        data: { checkIn }
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel check-in
 * @route   PUT /api/checkins/:id/cancel
 * @access  Private
 */
exports.cancelCheckIn = async (req, res, next) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return next(new ErrorResponse('Check-in not found', 404));
    }

    // Verify user owns this check-in
    if (checkIn.user.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse('You are not authorized to cancel this check-in', 403)
      );
    }

    // Cancel check-in
    try {
      await checkIn.cancel();

      res.status(200).json({
        success: true,
        message: 'Check-in cancelled successfully',
        data: { checkIn }
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update check-in location
 * @route   PUT /api/checkins/:id/location
 * @access  Private
 */
exports.updateCheckInLocation = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.body;

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

    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return next(new ErrorResponse('Check-in not found', 404));
    }

    // Verify user owns this check-in
    if (checkIn.user.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse('You are not authorized to update this check-in', 403)
      );
    }

    // Update location
    try {
      await checkIn.updateLocation(longitude, latitude);

      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: { checkIn }
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Acknowledge check-in (by circle member)
 * @route   POST /api/checkins/:id/acknowledge
 * @access  Private
 */
exports.acknowledgeCheckIn = async (req, res, next) => {
  try {
    const { message } = req.body;

    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return next(new ErrorResponse('Check-in not found', 404));
    }

    // Verify user is a member of the circle
    const circle = await Circle.findById(checkIn.circle);
    if (!circle.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You must be a circle member to acknowledge check-ins', 403)
      );
    }

    // Add acknowledgment
    await checkIn.addAcknowledgment(req.user._id, message || '');

    await checkIn.populate('acknowledgments.user', 'name profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Check-in acknowledged successfully',
      data: { checkIn }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get overdue check-ins (admin/system function)
 * @route   GET /api/checkins/overdue
 * @access  Private
 */
exports.getOverdueCheckIns = async (req, res, next) => {
  try {
    const overdueCheckIns = await CheckIn.findOverdue();

    res.status(200).json({
      success: true,
      count: overdueCheckIns.length,
      data: { checkIns: overdueCheckIns }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete check-in
 * @route   DELETE /api/checkins/:id
 * @access  Private
 */
exports.deleteCheckIn = async (req, res, next) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return next(new ErrorResponse('Check-in not found', 404));
    }

    // Verify user owns this check-in
    if (checkIn.user.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse('You are not authorized to delete this check-in', 403)
      );
    }

    // Soft delete
    checkIn.isDeleted = true;
    await checkIn.save();

    res.status(200).json({
      success: true,
      message: 'Check-in deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
