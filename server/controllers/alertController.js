// File: server/controllers/alertController.js
// Purpose: Handle alert operations - create panic alerts, acknowledge, resolve
// Dependencies: Alert model, Circle model, CheckIn model, ErrorResponse

const Alert = require('../models/Alert');
const Circle = require('../models/Circle');
const CheckIn = require('../models/CheckIn');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get all alerts for current user
 * @route   GET /api/alerts
 * @access  Private
 */
exports.getMyAlerts = async (req, res, next) => {
  try {
    const { status } = req.query;

    const alerts = await Alert.findByUser(req.user._id, status);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get alerts for a specific circle
 * @route   GET /api/alerts/circle/:circleId
 * @access  Private
 */
exports.getCircleAlerts = async (req, res, next) => {
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
        new ErrorResponse('You are not authorized to view alerts for this circle', 403)
      );
    }

    const query = {
      circle: circleId,
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    const alerts = await Alert.find(query)
      .populate('triggeredBy', 'name email profilePhoto')
      .populate('acknowledgedBy.user', 'name profilePhoto')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active alerts for a circle
 * @route   GET /api/alerts/circle/:circleId/active
 * @access  Private
 */
exports.getCircleActiveAlerts = async (req, res, next) => {
  try {
    const { circleId } = req.params;

    // Verify user is member of circle
    const circle = await Circle.findById(circleId);
    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    if (!circle.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You are not authorized to view alerts for this circle', 403)
      );
    }

    const alerts = await Alert.findActiveByCircle(circleId);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single alert by ID
 * @route   GET /api/alerts/:id
 * @access  Private
 */
exports.getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('triggeredBy', 'name email profilePhoto phone')
      .populate('circle', 'name members')
      .populate('acknowledgedBy.user', 'name email profilePhoto')
      .populate('resolvedBy', 'name email')
      .populate('relatedCheckIn');

    if (!alert) {
      return next(new ErrorResponse('Alert not found', 404));
    }

    // Verify user is either the alert creator or a circle member
    const circle = await Circle.findById(alert.circle);
    if (
      alert.triggeredBy._id.toString() !== req.user._id.toString() &&
      !circle.isMember(req.user._id)
    ) {
      return next(
        new ErrorResponse('You are not authorized to view this alert', 403)
      );
    }

    res.status(200).json({
      success: true,
      data: { alert }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create panic alert
 * @route   POST /api/alerts
 * @access  Private
 */
exports.createAlert = async (req, res, next) => {
  try {
    const {
      circle,
      type,
      severity,
      title,
      message,
      location,
      relatedCheckIn
    } = req.body;

    // Verify circle exists and user is member
    const circleDoc = await Circle.findById(circle);
    if (!circleDoc) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    if (!circleDoc.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You must be a member of the circle to create an alert', 403)
      );
    }

    // If related to check-in, verify ownership
    if (relatedCheckIn) {
      const checkIn = await CheckIn.findById(relatedCheckIn);
      if (!checkIn || checkIn.user.toString() !== req.user._id.toString()) {
        return next(new ErrorResponse('Invalid check-in reference', 400));
      }
    }

    // Create alert
    const alert = await Alert.create({
      triggeredBy: req.user._id,
      circle,
      type: type || 'panic',
      severity: severity || 'critical',
      title,
      message: message || '',
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address || '',
        accuracy: location.accuracy || null
      },
      relatedCheckIn: relatedCheckIn || null,
      status: 'active',
      priority: 5
    });

    // Increment circle alert count
    await circleDoc.incrementAlerts();

    // Populate necessary fields
    await alert.populate('triggeredBy', 'name email profilePhoto phone');
    await alert.populate('circle', 'name members');

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: { alert }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Acknowledge alert
 * @route   POST /api/alerts/:id/acknowledge
 * @access  Private
 */
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const { response, notes } = req.body;

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return next(new ErrorResponse('Alert not found', 404));
    }

    // Verify user is a member of the circle
    const circle = await Circle.findById(alert.circle);
    if (!circle.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You must be a circle member to acknowledge alerts', 403)
      );
    }

    // Acknowledge alert
    await alert.acknowledge(
      req.user._id,
      response || 'monitoring',
      notes || ''
    );

    await alert.populate('acknowledgedBy.user', 'name email profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: { alert }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resolve alert
 * @route   PUT /api/alerts/:id/resolve
 * @access  Private
 */
exports.resolveAlert = async (req, res, next) => {
  try {
    const { resolutionStatus, notes } = req.body;

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return next(new ErrorResponse('Alert not found', 404));
    }

    // Verify user is either the alert creator or circle admin
    const circle = await Circle.findById(alert.circle);
    const isCreator = alert.triggeredBy.toString() === req.user._id.toString();
    const isAdmin = circle.isAdmin(req.user._id);

    if (!isCreator && !isAdmin) {
      return next(
        new ErrorResponse(
          'Only the alert creator or circle admin can resolve alerts',
          403
        )
      );
    }

    // Resolve alert
    try {
      await alert.resolve(
        req.user._id,
        resolutionStatus || 'safe',
        notes || ''
      );

      res.status(200).json({
        success: true,
        message: 'Alert resolved successfully',
        data: { alert }
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel alert
 * @route   PUT /api/alerts/:id/cancel
 * @access  Private
 */
exports.cancelAlert = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return next(new ErrorResponse('Alert not found', 404));
    }

    // Verify user is the alert creator
    if (alert.triggeredBy.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse('Only the alert creator can cancel alerts', 403)
      );
    }

    // Cancel alert
    try {
      await alert.cancel(req.user._id, reason || '');

      res.status(200).json({
        success: true,
        message: 'Alert cancelled successfully',
        data: { alert }
      });
    } catch (err) {
      return next(new ErrorResponse(err.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark alert as false alarm
 * @route   PUT /api/alerts/:id/false-alarm
 * @access  Private
 */
exports.markFalseAlarm = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return next(new ErrorResponse('Alert not found', 404));
    }

    // Verify user is the alert creator
    if (alert.triggeredBy.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse('Only the alert creator can mark as false alarm', 403)
      );
    }

    // Mark as false alarm
    await alert.markFalseAlarm(req.user._id, reason || '');

    res.status(200).json({
      success: true,
      message: 'Alert marked as false alarm',
      data: { alert }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get alerts needing escalation (system/admin function)
 * @route   GET /api/alerts/escalation-needed
 * @access  Private
 */
exports.getAlertsNeedingEscalation = async (req, res, next) => {
  try {
    const alerts = await Alert.findNeedingEscalation();

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete alert
 * @route   DELETE /api/alerts/:id
 * @access  Private
 */
exports.deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return next(new ErrorResponse('Alert not found', 404));
    }

    // Verify user is the alert creator or circle admin
    const circle = await Circle.findById(alert.circle);
    const isCreator = alert.triggeredBy.toString() === req.user._id.toString();
    const isAdmin = circle.isAdmin(req.user._id);

    if (!isCreator && !isAdmin) {
      return next(
        new ErrorResponse(
          'Only the alert creator or circle admin can delete alerts',
          403
        )
      );
    }

    // Soft delete
    alert.isDeleted = true;
    alert.deletedAt = Date.now();
    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get alert statistics for a circle
 * @route   GET /api/alerts/circle/:circleId/stats
 * @access  Private
 */
exports.getCircleAlertStats = async (req, res, next) => {
  try {
    const { circleId } = req.params;

    // Verify user is member of circle
    const circle = await Circle.findById(circleId);
    if (!circle) {
      return next(new ErrorResponse('Circle not found', 404));
    }

    if (!circle.isMember(req.user._id)) {
      return next(
        new ErrorResponse('You are not authorized to view stats for this circle', 403)
      );
    }

    // Get statistics
    const totalAlerts = await Alert.countDocuments({
      circle: circleId,
      isDeleted: false
    });

    const activeAlerts = await Alert.countDocuments({
      circle: circleId,
      status: { $in: ['active', 'acknowledged'] },
      isDeleted: false
    });

    const resolvedAlerts = await Alert.countDocuments({
      circle: circleId,
      status: 'resolved',
      isDeleted: false
    });

    const alertsByType = await Alert.aggregate([
      { $match: { circle: circle._id, isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const alertsBySeverity = await Alert.aggregate([
      { $match: { circle: circle._id, isDeleted: false } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total: totalAlerts,
          active: activeAlerts,
          resolved: resolvedAlerts,
          byType: alertsByType,
          bySeverity: alertsBySeverity
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
