import axiosClient from './axiosClient';
import type { ApiResponse, CompanySettings, OfficeSettings } from '../types';

export const settingsApi = {
  get: () => axiosClient.get<ApiResponse<{ company: CompanySettings; office: OfficeSettings }>>('/settings'),
  update: (payload: { company?: Partial<CompanySettings>; office?: Partial<OfficeSettings> }) =>
    axiosClient.put<ApiResponse<{ company?: CompanySettings; office?: OfficeSettings }>>('/settings', payload),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return axiosClient.post<ApiResponse<CompanySettings>>('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
