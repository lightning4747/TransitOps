import client from './client';
import type { FuelLog } from '../types';

export interface FuelFilters {
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateFuelLogInput {
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
}

export const getFuelLogs = async (filters?: FuelFilters): Promise<FuelLog[]> => {
  const { data } = await client.get<FuelLog[]>('/fuel-logs', { params: filters });
  return data;
};

export const createFuelLog = async (input: CreateFuelLogInput): Promise<FuelLog> => {
  const { data } = await client.post<FuelLog>('/fuel-logs', input);
  return data;
};
