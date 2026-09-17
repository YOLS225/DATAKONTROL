import { Injectable } from "@nestjs/common";
import {
  Notification,
  type NotificationType,
} from "../../../domain/entities/notification.entity.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import type {
  ListNotificationsQuery,
  NotificationRepository,
  PaginatedNotifications,
} from "../../../domain/ports/repositories/notification.repository.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(notification: Notification): Promise<void> {
    await this.prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: this.toPersistenceData(notification.data),
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      },
    });
  }

  async findAll({
    userId,
    page,
    pageSize,
    unread,
  }: ListNotificationsQuery): Promise<PaginatedNotifications> {
    const where = {
      userId,
      ...(unread === true && { readAt: null }),
    };
    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      content: records.map((record) => this.toDomain(record)),
      total,
      page,
      page_size: pageSize,
    };
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markAsRead(
    userId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt },
    });
    return result.count === 1;
  }

  async markAllAsRead(userId: string, readAt: Date): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt },
    });
    return result.count;
  }

  private toDomain(record: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data: unknown;
    readAt: Date | null;
    createdAt: Date;
  }): Notification {
    return new Notification(
      record.id,
      record.userId,
      this.toDomainType(record.type),
      record.title,
      record.message,
      this.toDomainData(record.data),
      record.readAt,
      record.createdAt,
    );
  }

  private toDomainType(type: string): NotificationType {
    switch (type) {
      case "UPLOAD_COMPLETED":
      case "UPLOAD_COMPLETED_WITH_ERRORS":
      case "UPLOAD_FAILED":
        return type;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  private toPersistenceData(
    value: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | undefined {
    if (value === null) return undefined;
    return value as Prisma.InputJsonValue;
  }

  private toDomainData(value: unknown): Record<string, unknown> | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    throw new Error("Stored notification data is invalid");
  }
}
