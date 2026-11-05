const pool = require('../config/db');

/**
 * Repository layer isolating database queries for the resources table.
 * Supports resource creation, retrieval, filtering, updates, deletion,
 * and availability calculation.
 */
const resourceRepository = {
  /**
   * Retrieves all resources matching optional filter criteria.
   * @param {Object} [filters]
   * @param {string} [filters.type]
   * @param {string} [filters.status]
   * @param {number|boolean} [filters.is_active=1]
   * @param {string} [filters.search]
   * @param {number} [filters.limit]
   * @param {number} [filters.offset]
   * @returns {Promise<Array<Object>>}
   */
  async findAll(filters = {}) {
    let query = 'SELECT id, name, type, capacity, location, description, status, is_active, created_at, updated_at FROM resources WHERE 1=1';
    const params = [];

    query += ' AND is_active = ?';
    params.push(filters.is_active !== undefined ? (filters.is_active ? 1 : 0) : 1);

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR location LIKE ? OR description LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY id ASC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(Number(filters.limit));
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(Number(filters.offset));
      }
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  /**
   * Retrieves a single resource by its primary key ID.
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const query = 'SELECT id, name, type, capacity, location, description, status, is_active, created_at, updated_at FROM resources WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Creates a new resource entry in the database.
   * @param {Object} resourceData
   * @param {string} resourceData.name
   * @param {string} [resourceData.type='ROOM']
   * @param {number} [resourceData.capacity=1]
   * @param {string} [resourceData.location]
   * @param {string} [resourceData.description]
   * @param {string} [resourceData.status='AVAILABLE']
   * @param {number} [resourceData.is_active=1]
   * @returns {Promise<Object>} The created resource with its generated ID.
   */
  async create({ name, type = 'ROOM', capacity = 1, location = null, description = null, status = 'AVAILABLE', is_active = 1 }) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Resource name is required');
    }

    const query = `
      INSERT INTO resources (name, type, capacity, location, description, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [name.trim(), type, Number(capacity), location, description, status, is_active ? 1 : 0];
    const [result] = await pool.query(query, params);

    return this.findById(result.insertId);
  },

  /**
   * Updates an existing resource with specified field values.
   * Only whitelisted fields are modified.
   * @param {number|string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    const allowedFields = ['name', 'type', 'capacity', 'location', 'description', 'status', 'is_active'];
    const fieldsToUpdate = [];
    const params = [];

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        fieldsToUpdate.push(`${key} = ?`);
        if (key === 'is_active') {
          params.push(updateData[key] ? 1 : 0);
        } else if (key === 'capacity') {
          params.push(Number(updateData[key]));
        } else if (key === 'name') {
          params.push(updateData[key].trim());
        } else {
          params.push(updateData[key]);
        }
      }
    }

    if (fieldsToUpdate.length === 0) {
      return this.findById(id);
    }

    const query = `UPDATE resources SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    params.push(id);

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  },

  /**
   * Soft-deletes a resource by setting is_active = 0.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    const query = 'UPDATE resources SET is_active = 0 WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  },

  /**
   * Permanently deletes a resource record from the database.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const query = 'DELETE FROM resources WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  },

  /**
   * Finds available resources for a designated time window without conflicting bookings.
   * A conflict occurs when an APPROVED request overlaps with the target [startTime, endTime].
   * @param {Object} criteria
   * @param {string|Date} criteria.startTime
   * @param {string|Date} criteria.endTime
   * @param {string} [criteria.type]
   * @param {number} [criteria.minCapacity]
   * @returns {Promise<Array<Object>>}
   */
  async findAvailableResources({ startTime, endTime, type, minCapacity } = {}) {
    if (!startTime || !endTime) {
      throw new Error('Both startTime and endTime are required to check resource availability');
    }

    let query = `
      SELECT r.id, r.name, r.type, r.capacity, r.location, r.description, r.status, r.is_active
      FROM resources r
      WHERE r.is_active = 1
        AND r.status = 'AVAILABLE'
        AND r.id NOT IN (
          SELECT req.resource_id
          FROM requests req
          WHERE req.status = 'APPROVED'
            AND req.start_time < ?
            AND req.end_time > ?
        )
    `;
    const params = [endTime, startTime];

    if (type) {
      query += ' AND r.type = ?';
      params.push(type);
    }

    if (minCapacity) {
      query += ' AND r.capacity >= ?';
      params.push(Number(minCapacity));
    }

    query += ' ORDER BY r.capacity ASC, r.name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }
};

module.exports = resourceRepository;
