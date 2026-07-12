import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '../api/reports';
import {
  mockFuelEfficiency,
  mockUtilization,
  mockOperationalCost,
  mockRoi,
} from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const useFuelEfficiency = (vehicleId?: string) =>
  useQuery({
    queryKey: ['reports', 'fuel-efficiency', vehicleId],
    queryFn: async () => {
      if (USE_MOCK) return mockFuelEfficiency;
      return reportsApi.getFuelEfficiency(vehicleId);
    },
  });

export const useUtilization = () =>
  useQuery({
    queryKey: ['reports', 'utilization'],
    queryFn: async () => {
      if (USE_MOCK) return mockUtilization;
      return reportsApi.getUtilization();
    },
  });

export const useOperationalCost = (vehicleId?: string) =>
  useQuery({
    queryKey: ['reports', 'operational-cost', vehicleId],
    queryFn: async () => {
      if (USE_MOCK) return mockOperationalCost;
      return reportsApi.getOperationalCost(vehicleId);
    },
  });

export const useRoi = (vehicleId?: string) =>
  useQuery({
    queryKey: ['reports', 'roi', vehicleId],
    queryFn: async () => {
      if (USE_MOCK) return mockRoi;
      return reportsApi.getRoi(vehicleId);
    },
  });
