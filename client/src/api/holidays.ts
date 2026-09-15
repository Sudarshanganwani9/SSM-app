import axiosClient from './axiosClient';
import type { ApiResponse, Holiday } from '../types';

export const holidayApi = {
  list: (params: { year?: number; upcoming?: boolean } = {}) =>
    axiosClient.get<ApiResponse<Holiday[]>>('/holidays', { params }),
  create: (payload: Partial<Holiday>) => axiosClient.post<ApiResponse<Holiday>>('/holidays', payload),
  update: (id: string, payload: Partial<Holiday>) => axiosClient.put<ApiResponse<Holiday>>(`/holidays/${id}`, payload),
  remove: (id: string) => axiosClient.delete<ApiResponse<null>>(`/holidays/${id}`),
  uploadIcon: (file: File) => {
    const formData = new FormData();
    formData.append('icon', file);
    return axiosClient.post<ApiResponse<{ url: string }>>('/holidays/icon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
