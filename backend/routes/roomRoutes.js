const express = require('express');
const roomController = require('../controllers/roomController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Public / Authenticated read routes
router.get('/', roomController.getAllRooms);
router.get('/available', roomController.getAvailableRooms);
router.get('/:id', roomController.getRoomById);

// Admin restricted room management routes
router.post('/', authenticate, authorize('ADMIN'), roomController.createRoom);
router.put('/:id', authenticate, authorize('ADMIN'), roomController.updateRoom);
router.delete('/:id', authenticate, authorize('ADMIN'), roomController.deleteRoom);

module.exports = router;
