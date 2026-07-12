import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as maintenanceApi from '../api/maintenance';
import type { MaintenanceFilters } from '../api/maintenance';
import { mockMaintenanceLogs, mockVehicles } from '../mocks/data';
import type { MaintenanceLog } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

let mockStore: MaintenanceLog[] = [...mockMaintenanceLogs];

export const useMaintenanceLogs = (filters?: MaintenanceFilters) => {
  return useQuery({
    queryKey: ['maintenance', filters],
    queryFn: async () => {
      if (USE_MOCK) {
        let data = [...mockStore];
        if (filters?.vehicleId) data = data.filter((m) => m.vehicleId === filters.vehicleId);
        if (filters?.status) data = data.filter((m) => m.status === filters.status);
        return data;
      }
      return maintenanceApi.getMaintenanceLogs(filters);
    },
  });
};

export const useCreateMaintenanceLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: maintenanceApi.CreateMaintenanceInput) => {
      if (USE_MOCK) {
        const vehicle = mockVehicles.find((v) => v.id === input.vehicleId);
        const newLog: MaintenanceLog = {
          id: `m${Date.now()}`,
          ...input,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          closedAt: null,
          vehicle,
        };
        mockStore = [newLog, ...mockStore];
        return newLog;
      }
      return maintenanceApi.createMaintenanceLog(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

export const useCloseMaintenanceLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        const log = mockStore.find((m) => m.id === id);
        if (!log) throw new Error('Log not found');
        const updated = { ...log, status: 'CLOSED' as const, closedAt: new Date().toISOString() };
        mockStore = mockStore.map((m) => (m.id === id ? updated : m));
        return updated;
      }
      return maintenanceApi.closeMaintenanceLog(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};
