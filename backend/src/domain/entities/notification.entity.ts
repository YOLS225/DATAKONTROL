export type NotificationType =
  "UPLOAD_COMPLETED" | "UPLOAD_COMPLETED_WITH_ERRORS" | "UPLOAD_FAILED";

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly data: Record<string, unknown> | null = null,
    public readonly readAt: Date | null = null,
    public readonly createdAt = new Date(),
  ) {}
}
