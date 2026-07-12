import client from './client';
import type { MaintenanceLog } from '../types';

export interface MaintenanceFilters {
  vehicleId?: string;
  status?: string;
}

export interface CreateMaintenanceInput {
  vehicleId: string;
  description: string;
  cost: number;
}

export const getMaintenanceLogs = async (filters?: MaintenanceFilters): Promise<MaintenanceLog[]> => {
  const { data } = await client.get<MaintenanceLog[]>('/maintenance-logs', { params: filters });
  return data;
};

export const createMaintenanceLog = async (input: CreateMaintenanceInput): Promise<MaintenanceLog> => {
  const { data } = await client.post<MaintenanceLog>('/maintenance-logs', input);
  return data;
};

export const closeMaintenanceLog = async (id: string): Promise<MaintenanceLog> => {
  const { data } = await client.post<MaintenanceLog>(`/maintenance-logs/${id}/close`);
  return data;
};
