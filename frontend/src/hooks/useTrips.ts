import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tripsApi from '../api/trips';
import type { TripFilters } from '../api/trips';
import { mockTrips, mockVehicles, mockDrivers } from '../mocks/data';
import type { Trip } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// In-memory mock store for mutations
let mockTripStore: Trip[] = [...mockTrips];

export const useTrips = (filters?: TripFilters) => {
  return useQuery({
    queryKey: ['trips', filters],
    queryFn: async () => {
      if (USE_MOCK) {
        let data = [...mockTripStore];
        if (filters?.status) data = data.filter((t) => t.status === filters.status);
        if (filters?.driverId) data = data.filter((t) => t.driverId === filters.driverId);
        if (filters?.vehicleId) data = data.filter((t) => t.vehicleId === filters.vehicleId);
        return data;
      }
      return tripsApi.getTrips(filters);
    },
  });
};

export const useCreateTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: tripsApi.CreateTripInput) => {
      if (USE_MOCK) {
        const vehicle = mockVehicles.find((v) => v.id === input.vehicleId);
        const driver = mockDrivers.find((d) => d.id === input.driverId);
        const newTrip: Trip = {
          id: `t${Date.now()}`,
          ...input,
          status: 'DRAFT',
          startOdometer: null,
          endOdometer: null,
          fuelConsumed: null,
          createdBy: 'u1',
          dispatchedAt: null,
          completedAt: null,
          cancelledAt: null,
          createdAt: new Date().toISOString(),
          vehicle,
          driver,
        };
        mockTripStore = [newTrip, ...mockTripStore];
        return newTrip;
      }
      return tripsApi.createTrip(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  });
};

export const useDispatchTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        const trip = mockTripStore.find((t) => t.id === id);
        if (!trip) throw new Error('Trip not found');
        const updated = { ...trip, status: 'DISPATCHED' as const, dispatchedAt: new Date().toISOString() };
        mockTripStore = mockTripStore.map((t) => (t.id === id ? updated : t));
        return updated;
      }
      return tripsApi.dispatchTrip(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
};

export const useCompleteTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: tripsApi.CompleteTripInput }) => {
      if (USE_MOCK) {
        const trip = mockTripStore.find((t) => t.id === id);
        if (!trip) throw new Error('Trip not found');
        const updated = {
          ...trip,
          status: 'COMPLETED' as const,
          endOdometer: input.endOdometer,
          fuelConsumed: input.fuelConsumed,
          completedAt: new Date().toISOString(),
        };
        mockTripStore = mockTripStore.map((t) => (t.id === id ? updated : t));
        return updated;
      }
      return tripsApi.completeTrip(id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
};

export const useCancelTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        const trip = mockTripStore.find((t) => t.id === id);
        if (!trip) throw new Error('Trip not found');
        const updated = { ...trip, status: 'CANCELLED' as const, cancelledAt: new Date().toISOString() };
        mockTripStore = mockTripStore.map((t) => (t.id === id ? updated : t));
        return updated;
      }
      return tripsApi.cancelTrip(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
};
