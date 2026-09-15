import axiosClient from './axiosClient';
import type { ApiResponse, Holiday, Leave, LeaveBalance, User } from '../types';

export interface AdminDashboardData {
  totals: {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    onLeaveToday: number;
    pendingLeaveRequests: number;
    lateEmployees: number;
    halfDayEmployees: number;
    cofAvailable: number;
    upcomingHolidaysCount: number;
  };
  upcomingHolidays: Holiday[];
  recentLeaveRequests: Leave[];
  recentRegistrations: User[];
  attendanceTrend: { date: string; present: number; absent: number }[];
  leaveStatistics: { name: string; totalDays: number }[];
}

export interface EmployeeDashboardData {
  profileCompleted: boolean;
  todayAttendance: unknown;
  leaveBalances: LeaveBalance[];
  pendingLeaveCount: number;
  upcomingHolidays: Holiday[];
  cofAvailable: number;
  recentNotifications: unknown[];
}

export const dashboardApi = {
  admin: () => axiosClient.get<ApiResponse<AdminDashboardData>>('/dashboard/admin'),
  employee: () => axiosClient.get<ApiResponse<EmployeeDashboardData>>('/dashboard/employee'),
};

export interface ReportParams {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  department?: string;
  status?: string;
}

/**
 * Downloads a report as CSV using the authenticated axios client (so the
 * JWT goes through the normal Authorization header instead of leaking into
 * a URL/query string), then saves it via a temporary object URL.
 */
async function downloadCsv(path: string, params: ReportParams, filename: string) {
  const response = await axiosClient.get(path, {
    params: { ...params, format: 'csv' },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const reportApi = {
  attendance: (params: ReportParams = {}) => axiosClient.get('/reports/attendance', { params }),
  leaves: (params: ReportParams = {}) => axiosClient.get('/reports/leaves', { params }),
  cof: (params: ReportParams = {}) => axiosClient.get('/reports/cof', { params }),
  employees: (params: ReportParams = {}) => axiosClient.get('/reports/employees', { params }),
  downloadCsv,
};

export const auditApi = {
  list: (params: { targetModel?: string; adminId?: string; page?: number; limit?: number } = {}) =>
    axiosClient.get('/audit-logs', { params }),
};
