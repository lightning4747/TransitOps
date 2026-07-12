import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as fuelApi from '../api/fuel';
import * as expensesApi from '../api/expenses';
import { mockFuelLogs, mockExpenses, mockVehicles } from '../mocks/data';
import type { FuelLog, Expense } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

let fuelStore: FuelLog[] = [...mockFuelLogs];
let expenseStore: Expense[] = [...mockExpenses];

export const useFuelLogs = (filters?: fuelApi.FuelFilters) => {
  return useQuery({
    queryKey: ['fuel', filters],
    queryFn: async () => {
      if (USE_MOCK) {
        let data = [...fuelStore];
        if (filters?.vehicleId) data = data.filter((f) => f.vehicleId === filters.vehicleId);
        return data;
      }
      return fuelApi.getFuelLogs(filters);
    },
  });
};

export const useCreateFuelLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: fuelApi.CreateFuelLogInput) => {
      if (USE_MOCK) {
        const vehicle = mockVehicles.find((v) => v.id === input.vehicleId);
        const newLog: FuelLog = {
          id: `f${Date.now()}`,
          ...input,
          createdAt: new Date().toISOString(),
          vehicle,
        };
        fuelStore = [newLog, ...fuelStore];
        return newLog;
      }
      return fuelApi.createFuelLog(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fuel'] }),
  });
};

export const useExpenses = (filters?: expensesApi.ExpenseFilters) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      if (USE_MOCK) {
        let data = [...expenseStore];
        if (filters?.vehicleId) data = data.filter((e) => e.vehicleId === filters.vehicleId);
        return data;
      }
      return expensesApi.getExpenses(filters);
    },
  });
};

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: expensesApi.CreateExpenseInput) => {
      if (USE_MOCK) {
        const vehicle = mockVehicles.find((v) => v.id === input.vehicleId);
        const newExp: Expense = {
          id: `e${Date.now()}`,
          ...input,
          createdAt: new Date().toISOString(),
          vehicle,
        };
        expenseStore = [newExp, ...expenseStore];
        return newExp;
      }
      return expensesApi.createExpense(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};
