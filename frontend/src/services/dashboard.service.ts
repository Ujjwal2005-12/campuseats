import { api } from './api';
import { DashboardStats } from '../types';
import { DEMO_STATS } from './demoData';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await api.get<{ stats: DashboardStats }>('/dashboard/stats');
      if (res.stats && res.stats.summary) {
        return res.stats;
      }
      return DEMO_STATS;
    } catch {
      return DEMO_STATS;
    }
  },
};
