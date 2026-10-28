const pool = require('../config/db');

/**
 * Repository layer isolating database queries for the users table.
 * Adheres to the contract: id, name, email, password_hash, role, is_active.
 */
const userRepository = {
  /**
   * Finds a user by email for authentication.
   * @param {string} email
   * @returns {Promise<Object|null>} User object including password_hash and is_active, or null.
   */
  async findUserByEmail(email) {
    const query = 'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?';
    const [rows] = await pool.query(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Finds a user by primary key ID for session restoration.
   * Excludes password_hash for safety.
   * @param {number|string} id
   * @returns {Promise<Object|null>} Safe user object with is_active, or null.
   */
  async findUserById(id) {
    const query = 'SELECT id, name, email, role, is_active FROM users WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Finds a user by primary key ID including password_hash (for password changes).
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  async findUserWithPasswordById(id) {
    const query = 'SELECT id, name, email, password_hash, role, is_active FROM users WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Creates a new user record.
   * @param {Object} userData
   * @param {string} userData.name
   * @param {string} userData.email
   * @param {string} userData.passwordHash
   * @param {string} [userData.role='STUDENT']
   * @param {number} [userData.isActive=1]
   * @returns {Promise<Object>} Safe user record without password_hash
   */
  async create({ name, email, passwordHash, role = 'STUDENT', isActive = 1 }) {
    const query = `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [name, email, passwordHash, role, isActive]);

    return {
      id: result.insertId,
      name,
      email,
      role,
      is_active: isActive
    };
  },

  /**
   * Updates user password hash.
   * @param {number|string} id
   * @param {string} passwordHash
   * @returns {Promise<boolean>}
   */
  async updatePassword(id, passwordHash) {
    const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
    const [result] = await pool.query(query, [passwordHash, id]);
    return result.affectedRows > 0;
  },

  /**
   * Retrieves all users with optional filtering (for admin management).
   * @param {Object} [filters]
   * @returns {Promise<Array<Object>>}
   */
  async findAll({ search, role, isActive, limit = 50, offset = 0 } = {}) {
    let query = 'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (isActive !== undefined && isActive !== null) {
      query += ' AND is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    query += ' ORDER BY id ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  /**
   * Updates user fields (name, role, is_active).
   * @param {number|string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    const allowedFields = ['name', 'role', 'is_active'];
    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(updateData[field]);
      }
    }

    if (updates.length === 0) {
      return this.findUserById(id);
    }

    params.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(query, params);

    return this.findUserById(id);
  },

  /**
   * Soft-deactivates a user.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    const query = 'UPDATE users SET is_active = 0 WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = userRepository;
