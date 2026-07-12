import client from './client';
import type { Vehicle } from '../types';

export interface VehicleFilters {
  type?: string;
  status?: string;
  region?: string;
  dispatchable?: boolean;
}

export interface CreateVehicleInput {
  regNumber: string;
  name: string;
  type: string;
  maxLoadKg: number;
  acquisitionCost: number;
  region?: string;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export const getVehicles = async (filters?: VehicleFilters): Promise<Vehicle[]> => {
  const { data } = await client.get<Vehicle[]>('/vehicles', { params: filters });
  return data;
};

export const getVehicle = async (id: string): Promise<Vehicle> => {
  const { data } = await client.get<Vehicle>(`/vehicles/${id}`);
  return data;
};

export const createVehicle = async (input: CreateVehicleInput): Promise<Vehicle> => {
  const { data } = await client.post<Vehicle>('/vehicles', input);
  return data;
};

export const updateVehicle = async (id: string, input: UpdateVehicleInput): Promise<Vehicle> => {
  const { data } = await client.patch<Vehicle>(`/vehicles/${id}`, input);
  return data;
};
