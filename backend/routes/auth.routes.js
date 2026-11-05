const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Public Authentication Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Authenticated User Session & Profile Routes
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);

// Role-Restricted Demonstration Route
router.get('/admin-only', authenticate, authorize('ADMIN'), authController.adminOnly);

module.exports = router;
