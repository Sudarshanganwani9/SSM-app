import axiosClient from './axiosClient';
import type { ApiResponse, Cof, Paginated } from '../types';

export interface CofFilters {
  status?: string;
  employeeId?: string;
  department?: string;
  page?: number;
  limit?: number;
}

export const cofApi = {
  my: () => axiosClient.get<ApiResponse<Cof[]> & { availableCount: number }>('/cof/my'),
  all: (filters: CofFilters = {}) => axiosClient.get<Paginated<Cof>>('/cof', { params: filters }),
  create: (payload: Record<string, unknown>) => axiosClient.post<ApiResponse<Cof>>('/cof', payload),
  update: (id: string, payload: Partial<Cof>) => axiosClient.put<ApiResponse<Cof>>(`/cof/${id}`, payload),
};
