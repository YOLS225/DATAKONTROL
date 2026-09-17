import type { NotificationRepository } from "../../../domain/ports/repositories/notification.repository.js";

export interface UnreadNotificationsCount {
  count: number;
}

export class GetUnreadNotificationsCountUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(userId: string): Promise<UnreadNotificationsCount> {
    return { count: await this.notifications.countUnread(userId) };
  }
}
