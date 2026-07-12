import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as vehiclesApi from '../api/vehicles';
import type { VehicleFilters } from '../api/vehicles';
import { mockVehicles } from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const useVehicles = (filters?: VehicleFilters) => {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      if (USE_MOCK) {
        let data = [...mockVehicles];
        if (filters?.dispatchable) data = data.filter((v) => v.status === 'AVAILABLE');
        if (filters?.status) data = data.filter((v) => v.status === filters.status);
        if (filters?.type) data = data.filter((v) => v.type === filters.type);
        if (filters?.region) data = data.filter((v) => v.region === filters.region);
        return data;
      }
      return vehiclesApi.getVehicles(filters);
    },
  });
};

export const useCreateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
};

export const useUpdateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: vehiclesApi.UpdateVehicleInput }) =>
      vehiclesApi.updateVehicle(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
};
