import axiosClient from './axiosClient';
import type { ApiResponse, Leave, LeaveBalance, LeaveType, Paginated } from '../types';

export interface ApplyLeavePayload {
  leaveType: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDaySession?: 'FIRST_HALF' | 'SECOND_HALF';
  reason: string;
  attachmentUrl?: string;
}

export interface LeaveFilters {
  status?: string;
  employeeId?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const leaveApi = {
  types: (all = false) => axiosClient.get<ApiResponse<LeaveType[]>>('/leaves/types', { params: { all } }),
  createType: (payload: Partial<LeaveType>) => axiosClient.post<ApiResponse<LeaveType>>('/leaves/types', payload),
  updateType: (id: string, payload: Partial<LeaveType>) =>
    axiosClient.put<ApiResponse<LeaveType>>(`/leaves/types/${id}`, payload),
  deleteType: (id: string) => axiosClient.delete<ApiResponse<LeaveType>>(`/leaves/types/${id}`),

  myBalance: (year?: number) =>
    axiosClient.get<ApiResponse<LeaveBalance[]>>('/leaves/balance/my', { params: { year } }),
  employeeBalance: (employeeId: string, year?: number) =>
    axiosClient.get<ApiResponse<LeaveBalance[]>>(`/leaves/balance/${employeeId}`, { params: { year } }),
  setEmployeeBalance: (employeeId: string, payload: { leaveType: string; year: number; totalDays: number }) =>
    axiosClient.put<ApiResponse<LeaveBalance>>(`/leaves/balance/${employeeId}`, payload),

  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append('attachment', file);
    return axiosClient.post<ApiResponse<{ url: string }>>('/leaves/attachment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  apply: (payload: ApplyLeavePayload) => axiosClient.post<ApiResponse<Leave>>('/leaves', payload),
  my: (status?: string) => axiosClient.get<ApiResponse<Leave[]>>('/leaves/my', { params: { status } }),
  all: (filters: LeaveFilters = {}) => axiosClient.get<Paginated<Leave>>('/leaves', { params: filters }),
  approve: (id: string, adminRemarks?: string) =>
    axiosClient.post<ApiResponse<Leave>>(`/leaves/${id}/approve`, { adminRemarks }),
  reject: (id: string, adminRemarks?: string) =>
    axiosClient.post<ApiResponse<Leave>>(`/leaves/${id}/reject`, { adminRemarks }),
  cancel: (id: string) => axiosClient.post<ApiResponse<Leave>>(`/leaves/${id}/cancel`),
};
