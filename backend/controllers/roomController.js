const roomRepository = require('../repositories/roomRepository');

/**
 * Controller handling room and facility resource endpoints.
 */
const roomController = {
  /**
   * GET /api/rooms
   * List all rooms with optional filtering (search, status, capacity).
   */
  async getAllRooms(req, res, next) {
    try {
      const { search, status, minCapacity, limit, offset } = req.query;
      const filters = {};

      if (search) filters.search = search;
      if (status) filters.status = status;
      if (minCapacity) filters.minCapacity = parseInt(minCapacity, 10);
      if (limit) filters.limit = parseInt(limit, 10);
      if (offset) filters.offset = parseInt(offset, 10);

      const rooms = await roomRepository.findAll(filters);
      return res.status(200).json({ rooms });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/rooms/available
   * List rooms available within a specific time window.
   */
  async getAvailableRooms(req, res, next) {
    try {
      const { startTime, endTime, minCapacity } = req.query;

      if (!startTime || !endTime) {
        return res.status(400).json({ message: 'startTime and endTime query parameters are required' });
      }

      if (new Date(endTime) <= new Date(startTime)) {
        return res.status(400).json({ message: 'endTime must be greater than startTime' });
      }

      const rooms = await roomRepository.findAvailable({
        startTime,
        endTime,
        minCapacity: minCapacity ? parseInt(minCapacity, 10) : undefined
      });

      return res.status(200).json({ rooms });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/rooms/:id
   * Get single room by ID.
   */
  async getRoomById(req, res, next) {
    try {
      const { id } = req.params;
      const room = await roomRepository.findById(id);

      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      return res.status(200).json({ room });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/rooms
   * Create a new room (Admin only).
   */
  async createRoom(req, res, next) {
    try {
      const { name, capacity, location, description, status } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Room name is required' });
      }

      const newRoom = await roomRepository.create({
        name: name.trim(),
        capacity: capacity ? parseInt(capacity, 10) : 1,
        location: location || null,
        description: description || null,
        status: status || 'AVAILABLE'
      });

      return res.status(201).json({
        message: 'Room created successfully',
        room: newRoom
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/rooms/:id
   * Update existing room (Admin only).
   */
  async updateRoom(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await roomRepository.findById(id);

      if (!existing) {
        return res.status(404).json({ message: 'Room not found' });
      }

      const updated = await roomRepository.update(id, req.body);
      return res.status(200).json({
        message: 'Room updated successfully',
        room: updated
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/rooms/:id
   * Soft-delete a room (Admin only).
   */
  async deleteRoom(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await roomRepository.findById(id);

      if (!existing) {
        return res.status(404).json({ message: 'Room not found' });
      }

      await roomRepository.softDelete(id);
      return res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = roomController;
