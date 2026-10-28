const bookingRepository = require('../repositories/bookingRepository');
const roomRepository = require('../repositories/roomRepository');

/**
 * Controller handling room reservation and access request endpoints.
 */
const bookingController = {
  /**
   * GET /api/bookings
   * Retrieves bookings. Students view their own bookings; Admins/Faculty view all bookings.
   */
  async getAllBookings(req, res, next) {
    try {
      const { status, roomId, limit, offset } = req.query;
      const user = req.user;

      let bookings;
      if (user.role === 'STUDENT') {
        // Students can only see their own bookings
        bookings = await bookingRepository.findByUserId(user.id, { status, limit, offset });
      } else {
        // Admin and Faculty can view all bookings across campus
        bookings = await bookingRepository.findAll({ status, resourceId: roomId, limit, offset });
      }

      return res.status(200).json({ bookings });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/bookings/my
   * Retrieves bookings belonging strictly to the currently logged-in user.
   */
  async getMyBookings(req, res, next) {
    try {
      const bookings = await bookingRepository.findByUserId(req.user.id);
      return res.status(200).json({ bookings });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/bookings/:id
   * Get booking details by ID with authorization check.
   */
  async getBookingById(req, res, next) {
    try {
      const { id } = req.params;
      const booking = await bookingRepository.findById(id);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Authorization guard: Students cannot inspect other students' bookings
      if (req.user.role === 'STUDENT' && booking.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      return res.status(200).json({ booking });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/bookings
   * Create a new reservation request.
   */
  async createBooking(req, res, next) {
    try {
      const { roomId, startTime, endTime, purpose } = req.body;

      // 1. Input validation
      if (!roomId || !startTime || !endTime || !purpose) {
        return res.status(400).json({
          message: 'roomId, startTime, endTime, and purpose are required'
        });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid datetime format for startTime or endTime' });
      }

      if (end <= start) {
        return res.status(400).json({ message: 'endTime must be strictly greater than startTime' });
      }

      // 2. Validate room exists
      const room = await roomRepository.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      if (room.status === 'MAINTENANCE' || room.status === 'UNAVAILABLE') {
        return res.status(400).json({ message: `Room is currently in ${room.status} status and cannot be booked` });
      }

      // 3. Conflict Detection
      const hasConflict = await bookingRepository.hasConflict(roomId, startTime, endTime);
      if (hasConflict) {
        return res.status(409).json({
          message: 'Booking conflict: An approved reservation already exists for this room during this time window'
        });
      }

      // 4. Create reservation request
      const booking = await bookingRepository.create({
        userId: req.user.id, // Strictly bound to verified JWT
        roomId,
        startTime,
        endTime,
        purpose: purpose.trim()
      });

      return res.status(201).json({
        message: 'Booking request submitted successfully',
        booking
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/bookings/:id/status
   * Review a booking (APPROVE / REJECT) - Faculty and Admin only.
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, rejection_reason } = req.body;

      if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({
          message: 'Invalid status. Permitted values: APPROVED, REJECTED, CANCELLED'
        });
      }

      const booking = await bookingRepository.findById(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // If approving, re-check conflict in case another booking was approved in the interim
      if (status === 'APPROVED') {
        const hasConflict = await bookingRepository.hasConflict(
          booking.resource_id,
          booking.start_time,
          booking.end_time,
          booking.id
        );
        if (hasConflict) {
          return res.status(409).json({
            message: 'Cannot approve: An overlapping approved reservation exists for this room'
          });
        }
      }

      const updated = await bookingRepository.updateStatus(id, {
        status,
        reviewed_by: req.user.id,
        rejection_reason: status === 'REJECTED' ? rejection_reason : null
      });

      return res.status(200).json({
        message: `Booking has been ${status.toLowerCase()}`,
        booking: updated
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/bookings/:id/cancel
   * Cancel an active or pending reservation.
   */
  async cancelBooking(req, res, next) {
    try {
      const { id } = req.params;
      const booking = await bookingRepository.findById(id);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Student can only cancel their own booking; Admin/Faculty can cancel any
      const isOwner = booking.user_id === req.user.id;
      const isStaff = ['ADMIN', 'FACULTY'].includes(req.user.role);

      if (!isOwner && !isStaff) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const cancelled = await bookingRepository.cancel(id, isStaff ? null : req.user.id);
      return res.status(200).json({
        message: 'Booking cancelled successfully',
        booking: cancelled
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = bookingController;
