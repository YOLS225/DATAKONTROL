import { axiosInstance } from '@/shared/api/axios-instance';
import type { DashboardPeriod, DashboardStatsResponse } from '@/features/dashboard/types/dashboard-stats';

class DashboardService {
  async getStats(params?: { period?: DashboardPeriod }) {
    return axiosInstance.get<DashboardStatsResponse>('/dashboard/stats', { params });
  }
}

export const dashboardService = new DashboardService();
