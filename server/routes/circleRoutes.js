// File: server/routes/circleRoutes.js
// Purpose: Define circle management routes
// Dependencies: express, circleController, middleware

const express = require('express');
const router = express.Router();
const {
  getMyCircles,
  getCircleById,
  createCircle,
  updateCircle,
  deleteCircle,
  inviteToCircle,
  joinCircleByCode,
  leaveCircle,
  removeMember,
  updateMemberRole,
  regenerateInviteCode,
  getCircleMembers
} = require('../controllers/circleController');
const { protect } = require('../middleware/auth');
const {
  validateCreateCircle,
  validateEmailInvite,
  validateObjectId
} = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Circle CRUD
router.get('/', getMyCircles);
router.post('/', validateCreateCircle, createCircle);
router.get('/:id', validateObjectId('id'), getCircleById);
router.put('/:id', validateObjectId('id'), updateCircle);
router.delete('/:id', validateObjectId('id'), deleteCircle);

// Circle members
router.get('/:id/members', validateObjectId('id'), getCircleMembers);
router.post('/:id/invite', validateObjectId('id'), validateEmailInvite, inviteToCircle);
router.post('/join/:inviteCode', joinCircleByCode);
router.post('/:id/leave', validateObjectId('id'), leaveCircle);
router.delete('/:id/members/:userId', validateObjectId('id'), validateObjectId('userId'), removeMember);
router.put('/:id/members/:userId/role', validateObjectId('id'), validateObjectId('userId'), updateMemberRole);

// Invite code management
router.post('/:id/regenerate-code', validateObjectId('id'), regenerateInviteCode);

module.exports = router;
