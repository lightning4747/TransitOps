import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '../api/dashboard';
import type { DashboardFilters } from '../api/dashboard';
import { mockDashboardStats } from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const useDashboard = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async () => {
      if (USE_MOCK) return { ...mockDashboardStats };
      return dashboardApi.getDashboard(filters);
    },
  });
};
