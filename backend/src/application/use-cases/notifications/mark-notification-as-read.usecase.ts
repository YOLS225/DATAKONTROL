import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { NotificationRepository } from "../../../domain/ports/repositories/notification.repository.js";

export class MarkNotificationAsReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(userId: string, notificationId: string): Promise<void> {
    const marked = await this.notifications.markAsRead(
      userId,
      notificationId,
      new Date(),
    );
    if (!marked) {
      throw new NotFoundError("Notification", notificationId);
    }
  }
}
