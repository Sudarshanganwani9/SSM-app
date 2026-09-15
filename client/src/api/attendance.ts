import axiosClient from './axiosClient';
import type { ApiResponse, Attendance, Paginated } from '../types';

export interface AttendanceFilters {
  month?: string;
  year?: string;
  status?: string;
  employeeId?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const attendanceApi = {
  punchIn: () => axiosClient.post<ApiResponse<Attendance>>('/attendance/punch-in'),
  punchOut: () => axiosClient.post<ApiResponse<Attendance>>('/attendance/punch-out'),
  today: () => axiosClient.get<ApiResponse<Attendance | null>>('/attendance/today'),
  my: (filters: AttendanceFilters = {}) =>
    axiosClient.get<ApiResponse<Attendance[]>>('/attendance/my', { params: filters }),
  all: (filters: AttendanceFilters = {}) =>
    axiosClient.get<Paginated<Attendance>>('/attendance', { params: filters }),
  update: (id: string, payload: Partial<Attendance> & { correctionNote?: string }) =>
    axiosClient.put<ApiResponse<Attendance>>(`/attendance/${id}`, payload),
  createManual: (payload: Record<string, unknown>) =>
    axiosClient.post<ApiResponse<Attendance>>('/attendance', payload),
};
