import type { Readable } from "node:stream";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import type { UploadRepository } from "../../../domain/ports/repositories/upload.repository.js";
import type { FileStorage } from "../../../domain/ports/services/file-storage.js";

export interface UploadFileResult {
  stream: Readable;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export class GetUploadFileUseCase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly uploadRepository: UploadRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    uploadId: string,
  ): Promise<UploadFileResult> {
    const source = await this.sourceRepository.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload || upload.sourceId !== sourceId) {
      throw new NotFoundError("Upload", uploadId);
    }

    const stream = await this.fileStorage.read(upload.filePath);
    return {
      stream,
      fileName: upload.fileName,
      fileType: upload.fileType,
      fileSize: upload.fileSize,
    };
  }
}
