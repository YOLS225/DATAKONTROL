import { Notification } from "../../../domain/entities/notification.entity.js";
import type { NotificationRepository } from "../../../domain/ports/repositories/notification.repository.js";
import type { UploadRepository } from "../../../domain/ports/repositories/upload.repository.js";

export class NotifyUploadFailedUseCase {
  constructor(
    private readonly uploads: UploadRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async execute(uploadId: string): Promise<void> {
    const upload = await this.uploads.findById(uploadId);
    if (!upload) return;

    await this.notifications.save(
      new Notification(
        crypto.randomUUID(),
        upload.userId,
        "UPLOAD_FAILED",
        "Upload échoué",
        `Le traitement du fichier ${upload.fileName} a échoué.`,
        {
          sourceId: upload.sourceId,
          uploadId: upload.id,
          status: upload.status,
        },
      ),
    );
  }
}
