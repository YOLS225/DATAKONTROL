import { axiosInstance } from '@/shared/api/axios-instance';
import type {
  NotificationListParams,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/features/notifications/types/notification';

class NotificationService {
  async listNotifications(params?: NotificationListParams) {
    return axiosInstance.get<NotificationListResponse>('/notifications', { params });
  }

  async getUnreadCount() {
    return axiosInstance.get<UnreadCountResponse>('/notifications/unread-count');
  }

  async markAsRead(id: string) {
    return axiosInstance.patch<void>(`/notifications/${id}/read`);
  }

  async markAllAsRead() {
    return axiosInstance.patch<{ data?: { count?: number }; success?: boolean; message?: string }>('/notifications/read-all');
  }
}

export const notificationService = new NotificationService();
