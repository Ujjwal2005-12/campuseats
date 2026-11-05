const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Modules
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Centralized error handling middleware
// Prevents exposing error stack traces, database credentials, or internal details to clients
app.use((err, req, res, next) => {
  // Log message safely for server debugging (never expose sensitive data)
  console.error('[Unhandled Server Error]:', err.message);

  res.status(500).json({
    message: 'Internal server error'
  });
});

module.exports = app;
