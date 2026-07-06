import type { Readable } from "node:stream";
import { ConflictException } from "../../../common/exceptions/conflict.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import { Upload } from "../../../domain/entities/upload.entity.js";
import type { SchemaVersionRepository } from "../../../domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import type { UploadRepository } from "../../../domain/ports/repositories/upload.repository.js";
import type { FileStorage } from "../../../domain/ports/services/file-storage.js";
import type { UploadQueue } from "../../../domain/ports/services/upload-queue.js";

export interface SaveFileCommand {
  userId: string;
  sourceId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  stream: Readable;
}

export class SaveFileUseCase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly schemaRepository: SchemaVersionRepository,
    private readonly uploadRepository: UploadRepository,
    private readonly fileStorage: FileStorage,
    private readonly uploadQueue: UploadQueue,
  ) {}

  async execute(command: SaveFileCommand): Promise<Upload> {
    const source = await this.sourceRepository.findById(command.sourceId);
    if (!source || source.userId !== command.userId) {
      throw new NotFoundError("Source", command.sourceId);
    }

    const schema = await this.schemaRepository.findActiveBySourceId(
      command.sourceId,
    );
    if (!schema) {
      throw new ConflictException("The source does not have an active schema");
    }

    const uploadId = crypto.randomUUID();
    const fileKey = `sources/${command.sourceId}/uploads/${uploadId}`;
    const upload = new Upload(
      uploadId,
      command.sourceId,
      schema.id,
      command.userId,
      command.fileName,
      command.fileSize,
      fileKey,
      command.fileType,
    );

    await this.fileStorage.save({
      key: fileKey,
      stream: command.stream,
      contentType: command.fileType,
      contentLength: command.fileSize,
    });

    try {
      await this.uploadRepository.save(upload);
    } catch (error) {
      try {
        await this.fileStorage.delete(fileKey);
      } catch {
        // Preserve the persistence error; orphan cleanup can be retried later.
      }
      throw error;
    }

    try {
      await this.uploadQueue.enqueue(upload.id);
    } catch (error) {
      try {
        await this.uploadRepository.fail(upload.id, new Date());
      } catch {
        // Preserve the queue error; the pending upload can be reconciled later.
      }
      throw error;
    }

    return upload;
  }
}
