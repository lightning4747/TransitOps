import client from './client';
import { useAuthStore } from '../store/authStore';
import type {
  FuelEfficiencyReport,
  UtilizationReport,
  OperationalCostReport,
  RoiReport,
} from '../types';

export const getFuelEfficiency = async (vehicleId?: string): Promise<FuelEfficiencyReport> => {
  const { data } = await client.get<FuelEfficiencyReport>('/reports/fuel-efficiency', {
    params: vehicleId ? { vehicleId } : undefined,
  });
  return data;
};

export const getUtilization = async (): Promise<UtilizationReport> => {
  const { data } = await client.get<UtilizationReport>('/reports/utilization');
  return data;
};

export const getOperationalCost = async (vehicleId?: string): Promise<OperationalCostReport> => {
  const { data } = await client.get<OperationalCostReport>('/reports/operational-cost', {
    params: vehicleId ? { vehicleId } : undefined,
  });
  return data;
};

export const getRoi = async (vehicleId?: string): Promise<RoiReport> => {
  const { data } = await client.get<RoiReport>('/reports/roi', {
    params: vehicleId ? { vehicleId } : undefined,
  });
  return data;
};

export const exportCsv = (): void => {
  const token = useAuthStore.getState().token;
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
  const url = `${baseUrl}/reports/export.csv${token ? `?token=${token}` : ''}`;
  window.open(url, '_blank');
};
