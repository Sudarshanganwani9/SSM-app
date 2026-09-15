import axiosClient from './axiosClient';
import type { ApiResponse, User } from '../types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    axiosClient.post<ApiResponse<{ id: string; email: string; employeeId: string }>>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    axiosClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', payload),

  logout: () => axiosClient.post('/auth/logout'),

  me: () => axiosClient.get<ApiResponse<User>>('/auth/me'),

  forgotPassword: (email: string) =>
    axiosClient.post<ApiResponse<null> & { devResetUrl?: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    axiosClient.post<ApiResponse<null>>('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    axiosClient.post<ApiResponse<null>>('/auth/change-password', { currentPassword, newPassword }),
};
