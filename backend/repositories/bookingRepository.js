const requestRepository = require('./requestRepository');

/**
 * Booking repository adapter providing room booking abstractions
 * over the underlying request data layer.
 * Facilitates direct integration with bookingController and bookingRoutes.
 */
const bookingRepository = {
  /**
   * Creates a room booking.
   * @param {Object} bookingData
   * @param {number|string} bookingData.userId
   * @param {number|string} bookingData.roomId
   * @param {string|Date} bookingData.startTime
   * @param {string|Date} bookingData.endTime
   * @param {string} bookingData.purpose
   * @returns {Promise<Object>}
   */
  async create({ userId, roomId, startTime, endTime, purpose }) {
    return requestRepository.create({
      user_id: userId,
      resource_id: roomId,
      start_time: startTime,
      end_time: endTime,
      purpose
    });
  },

  /**
   * Retrieves a booking by its ID.
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return requestRepository.findById(id);
  },

  /**
   * Retrieves bookings made by a user.
   * @param {number|string} userId
   * @param {Object} [filters]
   * @returns {Promise<Array<Object>>}
   */
  async findByUserId(userId, filters = {}) {
    return requestRepository.findByUserId(userId, filters);
  },

  /**
   * Retrieves all bookings with optional filtering.
   * @param {Object} [filters]
   * @returns {Promise<Array<Object>>}
   */
  async findAll(filters = {}) {
    return requestRepository.findAll(filters);
  },

  /**
   * Checks if a room has a booking conflict for a given time window.
   * @param {number|string} roomId
   * @param {string|Date} startTime
   * @param {string|Date} endTime
   * @param {number|string|null} [excludeBookingId=null]
   * @returns {Promise<boolean>}
   */
  async hasConflict(roomId, startTime, endTime, excludeBookingId = null) {
    return requestRepository.hasConflict(roomId, startTime, endTime, excludeBookingId);
  },

  /**
   * Updates booking status (e.g. APPROVED, REJECTED, CANCELLED).
   * @param {number|string} id
   * @param {Object} update
   * @returns {Promise<Object|null>}
   */
  async updateStatus(id, update) {
    return requestRepository.updateStatus(id, update);
  },

  /**
   * Cancels a booking.
   * @param {number|string} id
   * @param {number|string} [userId]
   * @returns {Promise<Object|null>}
   */
  async cancel(id, userId = null) {
    return requestRepository.cancel(id, userId);
  },

  /**
   * Permanently deletes a booking.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return requestRepository.delete(id);
  }
};

module.exports = bookingRepository;
