// File: server/middleware/validation.js
// Purpose: Input validation middleware for request data
// Dependencies: validator

const validator = require('validator');

/**
 * Validate registration input
 */
exports.validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Validate name
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (name.trim().length > 50) {
    errors.push('Name cannot exceed 50 characters');
  }

  // Validate email
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate login input
 */
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Validate email
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  if (!password) {
    errors.push('Password is required');
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate circle creation input
 */
exports.validateCreateCircle = (req, res, next) => {
  const { name } = req.body;
  const errors = [];

  // Validate name
  if (!name || name.trim().length === 0) {
    errors.push('Circle name is required');
  } else if (name.trim().length < 2) {
    errors.push('Circle name must be at least 2 characters');
  } else if (name.trim().length > 100) {
    errors.push('Circle name cannot exceed 100 characters');
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate check-in creation input
 */
exports.validateCreateCheckIn = (req, res, next) => {
  const { circle, location, expectedReturnTime } = req.body;
  const errors = [];

  // Validate circle
  if (!circle) {
    errors.push('Circle ID is required');
  }

  // Validate location
  if (!location) {
    errors.push('Location is required');
  } else {
    if (!location.coordinates || !Array.isArray(location.coordinates)) {
      errors.push('Location coordinates are required');
    } else if (location.coordinates.length !== 2) {
      errors.push('Location coordinates must be [longitude, latitude]');
    } else {
      const [longitude, latitude] = location.coordinates;
      if (
        typeof longitude !== 'number' ||
        typeof latitude !== 'number' ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        errors.push('Invalid coordinates');
      }
    }
  }

  // Validate expected return time
  if (!expectedReturnTime) {
    errors.push('Expected return time is required');
  } else {
    const returnTime = new Date(expectedReturnTime);
    if (isNaN(returnTime.getTime())) {
      errors.push('Invalid expected return time format');
    } else if (returnTime <= Date.now()) {
      errors.push('Expected return time must be in the future');
    }
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate alert creation input
 */
exports.validateCreateAlert = (req, res, next) => {
  const { circle, title, location } = req.body;
  const errors = [];

  // Validate circle
  if (!circle) {
    errors.push('Circle ID is required');
  }

  // Validate title
  if (!title || title.trim().length === 0) {
    errors.push('Alert title is required');
  } else if (title.trim().length > 100) {
    errors.push('Alert title cannot exceed 100 characters');
  }

  // Validate location
  if (!location) {
    errors.push('Location is required');
  } else {
    if (!location.coordinates || !Array.isArray(location.coordinates)) {
      errors.push('Location coordinates are required');
    } else if (location.coordinates.length !== 2) {
      errors.push('Location coordinates must be [longitude, latitude]');
    } else {
      const [longitude, latitude] = location.coordinates;
      if (
        typeof longitude !== 'number' ||
        typeof latitude !== 'number' ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        errors.push('Invalid coordinates');
      }
    }
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate email invitation
 */
exports.validateEmailInvite = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  // Validate email
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate ObjectId parameter
 */
exports.validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

/**
 * Validate update profile input
 */
exports.validateUpdateProfile = (req, res, next) => {
  const { name, phone, bio } = req.body;
  const errors = [];

  // Validate name if provided
  if (name !== undefined) {
    if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (name.trim().length > 50) {
      errors.push('Name cannot exceed 50 characters');
    }
  }

  // Validate phone if provided
  if (phone !== undefined && phone.trim().length > 0) {
    if (!/^\+?[\d\s\-()]+$/.test(phone)) {
      errors.push('Please provide a valid phone number');
    }
  }

  // Validate bio if provided
  if (bio !== undefined && bio.length > 500) {
    errors.push('Bio cannot exceed 500 characters');
  }

  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};
