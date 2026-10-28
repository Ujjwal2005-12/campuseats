const resourceRepository = require('./resourceRepository');

/**
 * Room repository adapter providing high-level room abstractions
 * over the underlying resource data layer.
 * Facilitates direct integration with roomController and roomRoutes.
 */
const roomRepository = {
  /**
   * Retrieves all rooms (resources with type='ROOM').
   * @param {Object} [filters]
   * @returns {Promise<Array<Object>>}
   */
  async findAll(filters = {}) {
    return resourceRepository.findAll({ ...filters, type: 'ROOM' });
  },

  /**
   * Retrieves a single room by ID.
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const resource = await resourceRepository.findById(id);
    if (!resource || resource.type !== 'ROOM') {
      return null;
    }
    return resource;
  },

  /**
   * Creates a new room entity.
   * @param {Object} roomData
   * @returns {Promise<Object>}
   */
  async create(roomData) {
    return resourceRepository.create({ ...roomData, type: 'ROOM' });
  },

  /**
   * Updates an existing room.
   * @param {number|string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    return resourceRepository.update(id, updateData);
  },

  /**
   * Soft-deletes a room.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    return resourceRepository.softDelete(id);
  },

  /**
   * Permanently deletes a room.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return resourceRepository.delete(id);
  },

  /**
   * Finds available rooms within a time window.
   * @param {Object} params
   * @param {string|Date} params.startTime
   * @param {string|Date} params.endTime
   * @param {number} [params.minCapacity]
   * @returns {Promise<Array<Object>>}
   */
  async findAvailable({ startTime, endTime, minCapacity } = {}) {
    return resourceRepository.findAvailableResources({
      startTime,
      endTime,
      type: 'ROOM',
      minCapacity
    });
  }
};

module.exports = roomRepository;
