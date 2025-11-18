// File: server/controllers/authController.js
// Purpose: Handle authentication operations - register, login, logout, refresh token
// Dependencies: User model, ErrorResponse

const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new ErrorResponse('User with this email already exists', 400));
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim() || ''
    });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Get user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid email or password', 401));
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is temporarily locked due to multiple failed login attempts. Please try again later.',
        lockUntil: user.lockUntil
      });
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      // Increment failed login attempts
      await user.incLoginAttempts();

      return next(new ErrorResponse('Invalid email or password', 401));
    }

    // Reset failed login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    await user.save();

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days or 1 day
    };

    // Send response with cookie
    res
      .status(200)
      .cookie('token', accessToken, cookieOptions)
      .json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.getPublicProfile(),
          accessToken,
          refreshToken
        }
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    // Clear refresh token from database
    req.user.refreshToken = undefined;
    await req.user.save();

    // Clear cookie
    res.clearCookie('token');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public (but requires valid refresh token)
 */
exports.refreshToken = async (req, res, next) => {
  try {
    // User is already attached by verifyRefreshToken middleware
    const user = req.user;

    // Generate new access token
    const accessToken = user.generateAccessToken();

    // Optionally generate new refresh token
    const refreshToken = user.generateRefreshToken();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    // User is already attached by protect middleware
    const user = await User.findById(req.user._id)
      .populate('circles', 'name memberCount')
      .select('-password -refreshToken');

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Please provide current and new password', 400));
    }

    if (newPassword.length < 8) {
      return next(new ErrorResponse('New password must be at least 8 characters', 400));
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};
