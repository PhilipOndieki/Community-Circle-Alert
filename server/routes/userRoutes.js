// File: server/routes/userRoutes.js
// Purpose: Define user profile and settings routes
// Dependencies: express, userController, middleware

const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePrivacySettings,
  updateLocation,
  toggleLocationSharing,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getUserById
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validateUpdateProfile, validateObjectId } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', validateUpdateProfile, updateProfile);

// Privacy settings
router.put('/privacy', updatePrivacySettings);

// Location routes
router.put('/location', updateLocation);
router.put('/location/sharing', toggleLocationSharing);

// Emergency contacts
router.post('/emergency-contacts', addEmergencyContact);
router.put('/emergency-contacts/:contactId', updateEmergencyContact);
router.delete('/emergency-contacts/:contactId', deleteEmergencyContact);

// Get user by ID (for circle members)
router.get('/:userId', validateObjectId('userId'), getUserById);

module.exports = router;
