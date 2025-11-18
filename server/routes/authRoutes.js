// File: server/routes/authRoutes.js
// Purpose: Define authentication routes
// Dependencies: express, authController, middleware

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updatePassword
} = require('../controllers/authController');
const { protect, verifyRefreshToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', verifyRefreshToken, refreshToken);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
