import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as driversApi from '../api/drivers';
import type { DriverFilters } from '../api/drivers';
import { mockDrivers } from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const useDrivers = (filters?: DriverFilters) => {
  return useQuery({
    queryKey: ['drivers', filters],
    queryFn: async () => {
      if (USE_MOCK) {
        let data = [...mockDrivers];
        if (filters?.dispatchable) {
          const today = new Date();
          data = data.filter(
            (d) => d.status === 'AVAILABLE' && new Date(d.licenseExpiry) > today,
          );
        }
        if (filters?.status) data = data.filter((d) => d.status === filters.status);
        return data;
      }
      return driversApi.getDrivers(filters);
    },
  });
};

export const useCreateDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: driversApi.createDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  });
};

export const useUpdateDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: driversApi.UpdateDriverInput }) =>
      driversApi.updateDriver(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  });
};
