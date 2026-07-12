import client from './client';
import type { Expense } from '../types';

export interface ExpenseFilters {
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateExpenseInput {
  vehicleId: string;
  type: string;
  amount: number;
  date: string;
}

export const getExpenses = async (filters?: ExpenseFilters): Promise<Expense[]> => {
  const { data } = await client.get<Expense[]>('/expenses', { params: filters });
  return data;
};

export const createExpense = async (input: CreateExpenseInput): Promise<Expense> => {
  const { data } = await client.post<Expense>('/expenses', input);
  return data;
};
