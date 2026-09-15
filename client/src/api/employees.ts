import axiosClient from './axiosClient';
import type { ApiResponse, EmployeeProfile, Paginated, User } from '../types';

export interface EmployeeListItem extends User {
  profile: EmployeeProfile | null;
}

export interface EmployeeListParams {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const employeeApi = {
  list: (params: EmployeeListParams = {}) =>
    axiosClient.get<Paginated<EmployeeListItem>>('/employees', { params }),

  getById: (id: string) =>
    axiosClient.get<ApiResponse<{ user: User; profile: EmployeeProfile }>>(`/employees/${id}`),

  getMyProfile: () => axiosClient.get<ApiResponse<{ user: User; profile: EmployeeProfile }>>('/employees/me/profile'),

  updateMyProfile: (payload: Partial<EmployeeProfile>) =>
    axiosClient.put<ApiResponse<{ user: User; profile: EmployeeProfile }>>('/employees/me/profile', payload),

  uploadMyPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return axiosClient.post<ApiResponse<EmployeeProfile>>('/employees/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateByAdmin: (id: string, payload: Record<string, unknown>) =>
    axiosClient.put<ApiResponse<{ user: User; profile: EmployeeProfile }>>(`/employees/${id}`, payload),

  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    axiosClient.patch<ApiResponse<User>>(`/employees/${id}/status`, { status }),

  resetPassword: (id: string) =>
    axiosClient.post<ApiResponse<null> & { devTempPassword?: string }>(`/employees/${id}/reset-password`),
};
