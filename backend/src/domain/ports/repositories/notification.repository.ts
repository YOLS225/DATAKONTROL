import type { Notification } from "../../entities/notification.entity.js";

export const NOTIFICATION_REPOSITORY = Symbol("NOTIFICATION_REPOSITORY");

export interface ListNotificationsQuery {
  userId: string;
  page: number;
  pageSize: number;
  unread?: boolean;
}

export interface PaginatedNotifications {
  content: Notification[];
  total: number;
  page: number;
  page_size: number;
}

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  findAll(query: ListNotificationsQuery): Promise<PaginatedNotifications>;
  countUnread(userId: string): Promise<number>;
  markAsRead(
    userId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<boolean>;
  markAllAsRead(userId: string, readAt: Date): Promise<number>;
}
