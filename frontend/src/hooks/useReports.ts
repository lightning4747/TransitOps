import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '../api/reports';
import type { FuelEfficiencyReport, UtilizationReport, OperationalCostReport, RoiReport } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const mockFuelEff: FuelEfficiencyReport = {
  vehicleId: null, totalDistance: 270, totalLiters: 80, fuelEfficiency: 3.38,
};
const mockUtil: UtilizationReport = { utilization: 25 };
const mockOpCost: OperationalCostReport = {
  vehicleId: null, fuelCost: 9600, maintenanceCost: 18000, expenseCost: 450, totalCost: 28050,
};
const mockRoiData: RoiReport = {
  vehicleId: null, revenueTracked: false, revenue: 0, fuelCost: 9600,
  maintenanceCost: 18000, acquisitionCost: 850000, roi: null,
};

export const useFuelEfficiency = (vehicleId?: string) =>
  useQuery({
    queryKey: ['reports', 'fuel-efficiency', vehicleId],
    queryFn: async () => {
      if (USE_MOCK) return mockFuelEff;
      return reportsApi.getFuelEfficiency(vehicleId);
    },
  });

export const useUtilization = () =>
  useQuery({
    queryKey: ['reports', 'utilization'],
    queryFn: async () => {
      if (USE_MOCK) return mockUtil;
      return reportsApi.getUtilization();
    },
  });

export const useOperationalCost = (vehicleId?: string) =>
  useQuery({
    queryKey: ['reports', 'operational-cost', vehicleId],
    queryFn: async () => {
      if (USE_MOCK) return mockOpCost;
      return reportsApi.getOperationalCost(vehicleId);
    },
  });

export const useRoi = (vehicleId?: string) =>
  useQuery({
    queryKey: ['reports', 'roi', vehicleId],
    queryFn: async () => {
      if (USE_MOCK) return mockRoiData;
      return reportsApi.getRoi(vehicleId);
    },
  });
