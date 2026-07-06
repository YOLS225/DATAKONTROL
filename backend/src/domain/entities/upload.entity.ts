export enum UploadStatus {
  PENDING = "PENDING",
  FAILED = "FAILED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
}

export class Upload {
  constructor(
    public readonly id: string,
    public readonly sourceId: string,
    public readonly schemaVersionId: string,
    public readonly userId: string,
    public readonly fileName: string,
    public readonly fileSize: number,
    public readonly filePath: string,
    public readonly fileType: string,
    public readonly status: UploadStatus = UploadStatus.PENDING,
    public readonly totalRows = 0,
    public readonly validRows = 0,
    public readonly invalidRows = 0,
    public readonly createdAt = new Date(),
    public readonly completedAt: Date | null = null,
  ) {}
}
