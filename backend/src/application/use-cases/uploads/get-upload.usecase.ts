import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { Upload } from "../../../domain/entities/upload.entity.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import type { UploadRepository } from "../../../domain/ports/repositories/upload.repository.js";

export class GetUploadUseCase {
  constructor(
    private readonly sources: SourceRepository,
    private readonly uploads: UploadRepository,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    uploadId: string,
  ): Promise<Upload> {
    const source = await this.sources.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const upload = await this.uploads.findById(uploadId);
    if (!upload || upload.sourceId !== sourceId) {
      throw new NotFoundError("Upload", uploadId);
    }

    return upload;
  }
}
