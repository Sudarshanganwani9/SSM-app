import axiosClient from './axiosClient';
import type { AppNotification, Paginated } from '../types';

export const notificationApi = {
  list: (params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) =>
    axiosClient.get<Paginated<AppNotification> & { unreadCount: number }>('/notifications', { params }),
  markRead: (id: string) => axiosClient.patch(`/notifications/${id}/read`),
  markAllRead: () => axiosClient.patch('/notifications/read-all'),
};
