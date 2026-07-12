import client from './client';
import type { Trip } from '../types';

export interface TripFilters {
  status?: string;
  driverId?: string;
  vehicleId?: string;
}

export interface CreateTripInput {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
}

export interface CompleteTripInput {
  endOdometer: number;
  fuelConsumed: number;
}

export const getTrips = async (filters?: TripFilters): Promise<Trip[]> => {
  const { data } = await client.get<Trip[]>('/trips', { params: filters });
  return data;
};

export const getTrip = async (id: string): Promise<Trip> => {
  const { data } = await client.get<Trip>(`/trips/${id}`);
  return data;
};

export const createTrip = async (input: CreateTripInput): Promise<Trip> => {
  const { data } = await client.post<Trip>('/trips', input);
  return data;
};

export const dispatchTrip = async (id: string): Promise<Trip> => {
  const { data } = await client.post<Trip>(`/trips/${id}/dispatch`);
  return data;
};

export const completeTrip = async (id: string, input: CompleteTripInput): Promise<Trip> => {
  const { data } = await client.post<Trip>(`/trips/${id}/complete`, input);
  return data;
};

export const cancelTrip = async (id: string): Promise<Trip> => {
  const { data } = await client.post<Trip>(`/trips/${id}/cancel`);
  return data;
};
