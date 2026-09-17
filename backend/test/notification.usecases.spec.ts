import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { GetUnreadNotificationsCountUseCase } from "../src/application/use-cases/notifications/get-unread-notifications-count.usecase.js";
import { ListNotificationsUseCase } from "../src/application/use-cases/notifications/list-notifications.usecase.js";
import { MarkAllNotificationsAsReadUseCase } from "../src/application/use-cases/notifications/mark-all-notifications-as-read.usecase.js";
import { MarkNotificationAsReadUseCase } from "../src/application/use-cases/notifications/mark-notification-as-read.usecase.js";
import { NotifyUploadCompletedUseCase } from "../src/application/use-cases/notifications/notify-upload-completed.usecase.js";
import { NotifyUploadFailedUseCase } from "../src/application/use-cases/notifications/notify-upload-failed.usecase.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { Notification } from "../src/domain/entities/notification.entity.js";
import { Upload, UploadStatus } from "../src/domain/entities/upload.entity.js";
import type { NotificationRepository } from "../src/domain/ports/repositories/notification.repository.js";
import type { UploadRepository } from "../src/domain/ports/repositories/upload.repository.js";

describe("Notification use cases", () => {
  let notifications: Mocked<NotificationRepository>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    notifications = {
      save: jest.fn(),
      findAll: jest.fn(),
      countUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("lists current user's notifications", async () => {
    const notification = new Notification(
      "notification-id",
      "user-id",
      "UPLOAD_COMPLETED",
      "Upload terminé",
      "Le fichier a été validé avec succès.",
    );
    notifications.findAll.mockResolvedValue({
      content: [notification],
      total: 1,
      page: 1,
      page_size: 20,
    });
    const useCase = new ListNotificationsUseCase(notifications);

    await useCase.execute("user-id", {
      page: 1,
      pageSize: 20,
      unread: true,
    });

    expect(notifications.findAll).toHaveBeenCalledWith({
      userId: "user-id",
      page: 1,
      pageSize: 20,
      unread: true,
    });
  });

  it("counts unread notifications", async () => {
    notifications.countUnread.mockResolvedValue(3);
    const useCase = new GetUnreadNotificationsCountUseCase(notifications);

    await expect(useCase.execute("user-id")).resolves.toEqual({ count: 3 });
  });

  it("marks one notification as read", async () => {
    notifications.markAsRead.mockResolvedValue(true);
    const useCase = new MarkNotificationAsReadUseCase(notifications);

    await useCase.execute("user-id", "notification-id");

    expect(notifications.markAsRead).toHaveBeenCalledWith(
      "user-id",
      "notification-id",
      new Date("2026-09-15T12:00:00.000Z"),
    );
  });

  it("throws when marking a missing notification as read", async () => {
    notifications.markAsRead.mockResolvedValue(false);
    const useCase = new MarkNotificationAsReadUseCase(notifications);

    await expect(
      useCase.execute("user-id", "missing-notification"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("marks all notifications as read", async () => {
    notifications.markAllAsRead.mockResolvedValue(5);
    const useCase = new MarkAllNotificationsAsReadUseCase(notifications);

    await expect(useCase.execute("user-id")).resolves.toEqual({ count: 5 });
    expect(notifications.markAllAsRead).toHaveBeenCalledWith(
      "user-id",
      new Date("2026-09-15T12:00:00.000Z"),
    );
  });
});

describe("Upload notification use cases", () => {
  let uploads: Mocked<UploadRepository>;
  let notifications: Mocked<NotificationRepository>;

  beforeEach(() => {
    uploads = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      markProcessing: jest.fn(),
      fail: jest.fn(),
      complete: jest.fn(),
    };
    notifications = {
      save: jest.fn(),
      findAll: jest.fn(),
      countUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };
  });

  it("creates a success notification for a completed upload without invalid rows", async () => {
    uploads.findById.mockResolvedValue(
      new Upload(
        "upload-id",
        "source-id",
        "schema-id",
        "user-id",
        "customers.csv",
        42,
        "sources/source-id/uploads/upload-id",
        "text/csv",
        UploadStatus.COMPLETED,
        10,
        10,
        0,
      ),
    );
    const useCase = new NotifyUploadCompletedUseCase(uploads, notifications);

    await useCase.execute("upload-id");

    expect(notifications.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-id",
        type: "UPLOAD_COMPLETED",
        title: "Upload terminé",
      }),
    );
  });

  it("creates a warning notification for a completed upload with invalid rows", async () => {
    uploads.findById.mockResolvedValue(
      new Upload(
        "upload-id",
        "source-id",
        "schema-id",
        "user-id",
        "customers.csv",
        42,
        "sources/source-id/uploads/upload-id",
        "text/csv",
        UploadStatus.COMPLETED,
        10,
        8,
        2,
      ),
    );
    const useCase = new NotifyUploadCompletedUseCase(uploads, notifications);

    await useCase.execute("upload-id");

    expect(notifications.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-id",
        type: "UPLOAD_COMPLETED_WITH_ERRORS",
        title: "Upload terminé avec erreurs",
      }),
    );
  });

  it("creates a failure notification for a failed upload", async () => {
    uploads.findById.mockResolvedValue(
      new Upload(
        "upload-id",
        "source-id",
        "schema-id",
        "user-id",
        "customers.csv",
        42,
        "sources/source-id/uploads/upload-id",
        "text/csv",
        UploadStatus.FAILED,
      ),
    );
    const useCase = new NotifyUploadFailedUseCase(uploads, notifications);

    await useCase.execute("upload-id");

    expect(notifications.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-id",
        type: "UPLOAD_FAILED",
        title: "Upload échoué",
      }),
    );
  });

  it("does not create an upload notification when the upload is missing", async () => {
    uploads.findById.mockResolvedValue(null);
    const useCase = new NotifyUploadCompletedUseCase(uploads, notifications);

    await useCase.execute("missing-upload");

    expect(notifications.save).not.toHaveBeenCalled();
  });
});
