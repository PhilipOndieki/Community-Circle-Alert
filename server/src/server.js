// File: server/server.js
// Purpose: Server startup file - initialize HTTP server, Socket.io, and database
// Dependencies: dotenv, http, socket.io, app, database connection

const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { initializeSocket } = require('./utils/socket');

// Set port
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize socket event handlers
initializeSocket(io);

// Make io accessible to routes (attach to app)
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`                                                                                                                  
    Status: Running                                         
    Port: ${PORT}                                            
    Environment: ${process.env.NODE_ENV || 'development'}                           
    Time: ${new Date().toLocaleString()}                  
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => {
    console.log('Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => {
    console.log('Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { server, io };
