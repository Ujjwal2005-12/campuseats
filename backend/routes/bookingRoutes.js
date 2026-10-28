const express = require('express');
const bookingController = require('../controllers/bookingController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

// All booking endpoints require authentication
router.use(authenticate);

// List bookings (role-filtered) and user personal bookings
router.get('/', bookingController.getAllBookings);
router.get('/my', bookingController.getMyBookings);
router.get('/:id', bookingController.getBookingById);

// Submit new booking request
router.post('/', bookingController.createBooking);

// Review approval/rejection (Admin and Faculty only)
router.put('/:id/status', authorize('ADMIN', 'FACULTY'), bookingController.updateStatus);

// Cancel booking (Owner or Admin/Faculty)
router.post('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
