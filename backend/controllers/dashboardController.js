const dashboardRepository = require('../repositories/dashboardRepository');

/**
 * Controller providing aggregated campus management metrics and activity feeds.
 */
const dashboardController = {
  /**
   * GET /api/dashboard/stats
   * Retrieves high-level analytics for campus management overview.
   */
  async getStats(req, res, next) {
    try {
      const stats = await dashboardRepository.getStats();
      return res.status(200).json({ stats });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dashboardController;
