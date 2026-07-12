import client from './client';
import type { DashboardStats } from '../types';

export interface DashboardFilters {
  vehicleType?: string;
  status?: string;
  region?: string;
}

export const getDashboard = async (filters?: DashboardFilters): Promise<DashboardStats> => {
  const { data } = await client.get<DashboardStats>('/dashboard', { params: filters });
  return data;
};
