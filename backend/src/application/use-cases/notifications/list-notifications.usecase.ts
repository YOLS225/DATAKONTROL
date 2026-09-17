import type {
  NotificationRepository,
  PaginatedNotifications,
} from "../../../domain/ports/repositories/notification.repository.js";

export interface ListNotificationsInput {
  page: number;
  pageSize: number;
  unread?: boolean;
}

export class ListNotificationsUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  execute(
    userId: string,
    input: ListNotificationsInput,
  ): Promise<PaginatedNotifications> {
    return this.notifications.findAll({
      userId,
      page: input.page,
      pageSize: input.pageSize,
      unread: input.unread,
    });
  }
}
