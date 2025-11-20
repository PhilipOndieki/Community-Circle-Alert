// File: server/routes/alertRoutes.js
// Purpose: Define alert routes
// Dependencies: express, alertController, middleware

const express = require('express');
const router = express.Router();
const {
  getMyAlerts,
  getCircleAlerts,
  getCircleActiveAlerts,
  getAlertById,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  cancelAlert,
  markFalseAlarm,
  getAlertsNeedingEscalation,
  deleteAlert,
  getCircleAlertStats
} = require('../controllers/alertController');
const { protect } = require('../middleware/auth');
const {
  validateCreateAlert,
  validateObjectId
} = require('../middleware/validation');

// All routes are protected
router.use(protect);

// User alerts
router.get('/', getMyAlerts);
router.get('/escalation-needed', getAlertsNeedingEscalation);

// Circle alerts
router.get('/circle/:circleId', validateObjectId('circleId'), getCircleAlerts);
router.get('/circle/:circleId/active', validateObjectId('circleId'), getCircleActiveAlerts);
router.get('/circle/:circleId/stats', validateObjectId('circleId'), getCircleAlertStats);

// Alert CRUD
router.post('/', validateCreateAlert, createAlert);
router.get('/:id', validateObjectId('id'), getAlertById);
router.delete('/:id', validateObjectId('id'), deleteAlert);

// Alert actions
router.post('/:id/acknowledge', validateObjectId('id'), acknowledgeAlert);
router.put('/:id/resolve', validateObjectId('id'), resolveAlert);
router.put('/:id/cancel', validateObjectId('id'), cancelAlert);
router.put('/:id/false-alarm', validateObjectId('id'), markFalseAlarm);

module.exports = router;
