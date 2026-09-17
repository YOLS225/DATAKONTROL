import { Module } from "@nestjs/common";
import { GetUnreadNotificationsCountUseCase } from "../application/use-cases/notifications/get-unread-notifications-count.usecase.js";
import { ListNotificationsUseCase } from "../application/use-cases/notifications/list-notifications.usecase.js";
import { MarkAllNotificationsAsReadUseCase } from "../application/use-cases/notifications/mark-all-notifications-as-read.usecase.js";
import { MarkNotificationAsReadUseCase } from "../application/use-cases/notifications/mark-notification-as-read.usecase.js";
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from "../domain/ports/repositories/notification.repository.js";
import { PrismaNotificationRepository } from "../infrastructure/persistence/repositories/notification.repository.js";
import { NotificationController } from "../presentation/controllers/notification.controller.js";
import { UserModule } from "./user.module.js";

@Module({
  imports: [UserModule],
  controllers: [NotificationController],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    {
      provide: ListNotificationsUseCase,
      inject: [NOTIFICATION_REPOSITORY],
      useFactory: (notifications: NotificationRepository) =>
        new ListNotificationsUseCase(notifications),
    },
    {
      provide: GetUnreadNotificationsCountUseCase,
      inject: [NOTIFICATION_REPOSITORY],
      useFactory: (notifications: NotificationRepository) =>
        new GetUnreadNotificationsCountUseCase(notifications),
    },
    {
      provide: MarkNotificationAsReadUseCase,
      inject: [NOTIFICATION_REPOSITORY],
      useFactory: (notifications: NotificationRepository) =>
        new MarkNotificationAsReadUseCase(notifications),
    },
    {
      provide: MarkAllNotificationsAsReadUseCase,
      inject: [NOTIFICATION_REPOSITORY],
      useFactory: (notifications: NotificationRepository) =>
        new MarkAllNotificationsAsReadUseCase(notifications),
    },
  ],
  exports: [NOTIFICATION_REPOSITORY],
})
export class NotificationModule {}
