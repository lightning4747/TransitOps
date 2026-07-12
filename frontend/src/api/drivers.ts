import client from './client';
import type { Driver } from '../types';

export interface DriverFilters {
  status?: string;
  dispatchable?: boolean;
}

export interface CreateDriverInput {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contactNumber: string;
  safetyScore?: number;
}

export type UpdateDriverInput = Partial<CreateDriverInput>;

export const getDrivers = async (filters?: DriverFilters): Promise<Driver[]> => {
  const { data } = await client.get<Driver[]>('/drivers', { params: filters });
  return data;
};

export const getDriver = async (id: string): Promise<Driver> => {
  const { data } = await client.get<Driver>(`/drivers/${id}`);
  return data;
};

export const createDriver = async (input: CreateDriverInput): Promise<Driver> => {
  const { data } = await client.post<Driver>('/drivers', input);
  return data;
};

export const updateDriver = async (id: string, input: UpdateDriverInput): Promise<Driver> => {
  const { data } = await client.patch<Driver>(`/drivers/${id}`, input);
  return data;
};
