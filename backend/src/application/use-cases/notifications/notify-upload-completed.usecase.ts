import { Notification } from "../../../domain/entities/notification.entity.js";
import type { NotificationRepository } from "../../../domain/ports/repositories/notification.repository.js";
import type { UploadRepository } from "../../../domain/ports/repositories/upload.repository.js";

export class NotifyUploadCompletedUseCase {
  constructor(
    private readonly uploads: UploadRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async execute(uploadId: string): Promise<void> {
    const upload = await this.uploads.findById(uploadId);
    if (!upload) return;

    const hasErrors = upload.invalidRows > 0;
    await this.notifications.save(
      new Notification(
        crypto.randomUUID(),
        upload.userId,
        hasErrors ? "UPLOAD_COMPLETED_WITH_ERRORS" : "UPLOAD_COMPLETED",
        hasErrors ? "Upload terminé avec erreurs" : "Upload terminé",
        hasErrors
          ? `Le fichier ${upload.fileName} contient ${upload.invalidRows} ligne(s) invalide(s).`
          : `Le fichier ${upload.fileName} a été validé avec succès.`,
        {
          sourceId: upload.sourceId,
          uploadId: upload.id,
          status: upload.status,
          totalRows: upload.totalRows,
          validRows: upload.validRows,
          invalidRows: upload.invalidRows,
        },
      ),
    );
  }
}
