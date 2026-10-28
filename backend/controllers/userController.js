const userRepository = require('../repositories/userRepository');

/**
 * Controller handling user administration operations (Admin only).
 */
const userController = {
  /**
   * GET /api/users
   * Lists users with optional filters (role, search by name/email, isActive).
   */
  async getAllUsers(req, res, next) {
    try {
      const { search, role, isActive, limit, offset } = req.query;
      const filters = {};

      if (search) filters.search = search;
      if (role) filters.role = role.toUpperCase();
      if (isActive !== undefined) filters.isActive = isActive === 'true' || isActive === '1';
      if (limit) filters.limit = parseInt(limit, 10);
      if (offset) filters.offset = parseInt(offset, 10);

      const users = await userRepository.findAll(filters);
      return res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/users/:id
   * Retrieves single user details.
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userRepository.findUserById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/users/:id
   * Updates user profile, role, or active status.
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, role, is_active } = req.body;

      const existing = await userRepository.findUserById(id);
      if (!existing) {
        return res.status(404).json({ message: 'User not found' });
      }

      const targetId = parseInt(id, 10);

      // Prevent Admin from accidentally demoting or locking themselves out
      if (req.user.id === targetId) {
        if (role && role !== 'ADMIN') {
          return res.status(400).json({ message: 'Admins cannot demote their own account' });
        }
        if (is_active === 0 || is_active === false) {
          return res.status(400).json({ message: 'Admins cannot deactivate their own account' });
        }
      }

      // Validate role if updating
      if (role && !['ADMIN', 'FACULTY', 'STUDENT'].includes(role.toUpperCase())) {
        return res.status(400).json({ message: 'Invalid role. Permitted: ADMIN, FACULTY, STUDENT' });
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (role) updateData.role = role.toUpperCase();
      if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;

      const updated = await userRepository.update(id, updateData);
      return res.status(200).json({
        message: 'User updated successfully',
        user: updated
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/users/:id
   * Soft-deactivates user account.
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const targetId = parseInt(id, 10);

      if (req.user.id === targetId) {
        return res.status(400).json({ message: 'Admins cannot deactivate their own account' });
      }

      const existing = await userRepository.findUserById(id);
      if (!existing) {
        return res.status(404).json({ message: 'User not found' });
      }

      await userRepository.softDelete(id);
      return res.status(200).json({ message: 'User account deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
