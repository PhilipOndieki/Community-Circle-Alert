// File: server/utils/socket.js
// Purpose: Socket.io event handlers for real-time features
// Dependencies: socket.io, jwt, User model

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Initialize Socket.io with authentication and event handlers
 */
const initializeSocket = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user
      const user = await User.findById(decoded.id).select('-password -refreshToken');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (!user.isActive) {
        return next(new Error('Authentication error: Account deactivated'));
      }

      // Attach user to socket
      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join user's circle rooms
    if (socket.user.circles && socket.user.circles.length > 0) {
      socket.user.circles.forEach((circleId) => {
        socket.join(`circle:${circleId.toString()}`);
      });
    }

    // Handle joining a circle room
    socket.on('join:circle', (circleId) => {
      socket.join(`circle:${circleId}`);
      console.log(`User ${socket.userId} joined circle ${circleId}`);
    });

    // Handle leaving a circle room
    socket.on('leave:circle', (circleId) => {
      socket.leave(`circle:${circleId}`);
      console.log(`User ${socket.userId} left circle ${circleId}`);
    });

    // Handle panic alert trigger
    socket.on('alert:trigger', (data) => {
      const { circleId, alert } = data;

      // Emit to all members in the circle
      socket.to(`circle:${circleId}`).emit('alert:new', {
        alert,
        triggeredBy: {
          id: socket.userId,
          name: socket.user.name,
          profilePhoto: socket.user.profilePhoto
        }
      });

      console.log(`Panic alert triggered by ${socket.userId} in circle ${circleId}`);
    });

    // Handle alert acknowledgment
    socket.on('alert:acknowledge', (data) => {
      const { alertId, circleId, acknowledgment } = data;

      // Emit to alert creator and circle members
      io.to(`circle:${circleId}`).emit('alert:acknowledged', {
        alertId,
        acknowledgment,
        acknowledgedBy: {
          id: socket.userId,
          name: socket.user.name,
          profilePhoto: socket.user.profilePhoto
        }
      });

      console.log(`Alert ${alertId} acknowledged by ${socket.userId}`);
    });

    // Handle alert resolution
    socket.on('alert:resolve', (data) => {
      const { alertId, circleId, resolution } = data;

      // Emit to circle members
      io.to(`circle:${circleId}`).emit('alert:resolved', {
        alertId,
        resolution,
        resolvedBy: {
          id: socket.userId,
          name: socket.user.name
        }
      });

      console.log(`Alert ${alertId} resolved by ${socket.userId}`);
    });

    // Handle check-in creation
    socket.on('checkin:create', (data) => {
      const { circleId, checkIn } = data;

      // Emit to circle members
      socket.to(`circle:${circleId}`).emit('checkin:new', {
        checkIn,
        user: {
          id: socket.userId,
          name: socket.user.name,
          profilePhoto: socket.user.profilePhoto
        }
      });

      console.log(`Check-in created by ${socket.userId} in circle ${circleId}`);
    });

    // Handle check-in completion
    socket.on('checkin:complete', (data) => {
      const { checkInId, circleId } = data;

      // Emit to circle members
      io.to(`circle:${circleId}`).emit('checkin:completed', {
        checkInId,
        userId: socket.userId
      });

      console.log(`Check-in ${checkInId} completed by ${socket.userId}`);
    });

    // Handle check-in overdue notification
    socket.on('checkin:overdue', (data) => {
      const { checkInId, circleId, checkIn } = data;

      // Emit to circle members
      io.to(`circle:${circleId}`).emit('checkin:overdue', {
        checkInId,
        checkIn
      });

      console.log(`Check-in ${checkInId} is overdue`);
    });

    // Handle location updates
    socket.on('location:update', (data) => {
      const { circleId, location } = data;

      // Emit location update to circle members
      socket.to(`circle:${circleId}`).emit('location:updated', {
        userId: socket.userId,
        location,
        timestamp: Date.now()
      });
    });

    // Handle typing indicator for chat (future feature)
    socket.on('typing:start', (data) => {
      const { circleId } = data;
      socket.to(`circle:${circleId}`).emit('user:typing', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('typing:stop', (data) => {
      const { circleId } = data;
      socket.to(`circle:${circleId}`).emit('user:stopped-typing', {
        userId: socket.userId
      });
    });

    // Handle user status (online/offline)
    socket.on('status:update', (data) => {
      const { status } = data;

      // Broadcast status to all user's circles
      if (socket.user.circles && socket.user.circles.length > 0) {
        socket.user.circles.forEach((circleId) => {
          socket.to(`circle:${circleId.toString()}`).emit('user:status-changed', {
            userId: socket.userId,
            status
          });
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.userId}, reason: ${reason}`);

      // Notify circles that user is offline
      if (socket.user.circles && socket.user.circles.length > 0) {
        socket.user.circles.forEach((circleId) => {
          socket.to(`circle:${circleId.toString()}`).emit('user:status-changed', {
            userId: socket.userId,
            status: 'offline'
          });
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  return io;
};

/**
 * Emit event to specific user
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit event to all members of a circle
 */
const emitToCircle = (io, circleId, event, data) => {
  io.to(`circle:${circleId}`).emit(event, data);
};

/**
 * Emit event to multiple users
 */
const emitToUsers = (io, userIds, event, data) => {
  userIds.forEach((userId) => {
    io.to(`user:${userId}`).emit(event, data);
  });
};

module.exports = {
  initializeSocket,
  emitToUser,
  emitToCircle,
  emitToUsers
};
