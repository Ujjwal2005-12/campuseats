const pool = require('../config/db');

/**
 * Repository layer compiling aggregate statistics and metrics for the dashboard.
 */
const dashboardRepository = {
  /**
   * Compiles campus analytics and usage metrics.
   * @returns {Promise<Object>} Aggregated dashboard metrics.
   */
  async getStats() {
    // 1. User statistics by role
    const [userRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'STUDENT' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'FACULTY' THEN 1 ELSE 0 END) as faculty,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users
      FROM users
    `);

    // 2. Resource statistics by status & type
    const [resourceRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_resources,
        SUM(CASE WHEN type = 'ROOM' THEN 1 ELSE 0 END) as rooms,
        SUM(CASE WHEN type = 'LAB' THEN 1 ELSE 0 END) as labs,
        SUM(CASE WHEN type = 'HALL' THEN 1 ELSE 0 END) as halls,
        SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied
      FROM resources
      WHERE is_active = 1
    `);

    // 3. Booking / Request statistics by lifecycle status
    const [requestRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
      FROM requests
    `);

    // 4. Five most recent booking requests with joined user and facility metadata
    const [recentRows] = await pool.query(`
      SELECT 
        req.id,
        req.start_time,
        req.end_time,
        req.purpose,
        req.status,
        req.created_at,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        res.name as resource_name,
        res.type as resource_type,
        res.location as resource_location
      FROM requests req
      JOIN users u ON req.user_id = u.id
      JOIN resources res ON req.resource_id = res.id
      ORDER BY req.created_at DESC
      LIMIT 5
    `);

    const users = userRows[0] || {};
    const resources = resourceRows[0] || {};
    const requests = requestRows[0] || {};

    return {
      summary: {
        totalUsers: Number(users.total_users || 0),
        activeUsers: Number(users.active_users || 0),
        totalFacilities: Number(resources.total_resources || 0),
        availableFacilities: Number(resources.available || 0),
        totalBookings: Number(requests.total_bookings || 0),
        pendingBookings: Number(requests.pending || 0)
      },
      users: {
        students: Number(users.students || 0),
        faculty: Number(users.faculty || 0),
        admins: Number(users.admins || 0)
      },
      facilities: {
        rooms: Number(resources.rooms || 0),
        labs: Number(resources.labs || 0),
        halls: Number(resources.halls || 0),
        available: Number(resources.available || 0),
        maintenance: Number(resources.maintenance || 0),
        occupied: Number(resources.occupied || 0)
      },
      bookings: {
        total: Number(requests.total_bookings || 0),
        pending: Number(requests.pending || 0),
        approved: Number(requests.approved || 0),
        rejected: Number(requests.rejected || 0),
        cancelled: Number(requests.cancelled || 0)
      },
      recentActivity: recentRows
    };
  }
};

module.exports = dashboardRepository;
