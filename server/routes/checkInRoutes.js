// File: server/routes/checkInRoutes.js
// Purpose: Define check-in routes
// Dependencies: express, checkInController, middleware

const express = require('express');
const router = express.Router();
const {
  getMyCheckIns,
  getMyActiveCheckIns,
  getCircleCheckIns,
  getCircleActiveCheckIns,
  getCheckInById,
  createCheckIn,
  completeCheckIn,
  cancelCheckIn,
  updateCheckInLocation,
  acknowledgeCheckIn,
  getOverdueCheckIns,
  deleteCheckIn
} = require('../controllers/checkInController');
const { protect } = require('../middleware/auth');
const {
  validateCreateCheckIn,
  validateObjectId
} = require('../middleware/validation');

// All routes are protected
router.use(protect);

// User check-ins
router.get('/', getMyCheckIns);
router.get('/active', getMyActiveCheckIns);
router.get('/overdue', getOverdueCheckIns);

// Circle check-ins
router.get('/circle/:circleId', validateObjectId('circleId'), getCircleCheckIns);
router.get('/circle/:circleId/active', validateObjectId('circleId'), getCircleActiveCheckIns);

// Check-in CRUD
router.post('/', validateCreateCheckIn, createCheckIn);
router.get('/:id', validateObjectId('id'), getCheckInById);
router.delete('/:id', validateObjectId('id'), deleteCheckIn);

// Check-in actions
router.put('/:id/complete', validateObjectId('id'), completeCheckIn);
router.put('/:id/cancel', validateObjectId('id'), cancelCheckIn);
router.put('/:id/location', validateObjectId('id'), updateCheckInLocation);
router.post('/:id/acknowledge', validateObjectId('id'), acknowledgeCheckIn);

module.exports = router;
