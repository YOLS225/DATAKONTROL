import type { NotificationRepository } from "../../../domain/ports/repositories/notification.repository.js";

export interface MarkAllNotificationsAsReadResult {
  count: number;
}

export class MarkAllNotificationsAsReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(userId: string): Promise<MarkAllNotificationsAsReadResult> {
    return {
      count: await this.notifications.markAllAsRead(userId, new Date()),
    };
  }
}
