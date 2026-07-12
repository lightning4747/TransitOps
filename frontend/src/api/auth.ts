import client from './client';
import type { AuthResponse } from '../types';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await client.post<AuthResponse>('/auth/login', { email, password });
  return data;
};
