const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Dashboard analytics require an active authenticated session
router.get('/stats', authenticate, dashboardController.getStats);

module.exports = router;
