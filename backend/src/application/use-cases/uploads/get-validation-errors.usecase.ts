import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import type { UploadRepository } from "../../../domain/ports/repositories/upload.repository.js";
import type {
  PaginatedValidationErrors,
  ValidationErrorRepository,
} from "../../../domain/ports/repositories/validation-error.repository.js";

export interface GetValidationErrorsQuery {
  page: number;
  pageSize: number;
}

export class GetValidationErrorsUseCase {
  constructor(
    private readonly sources: SourceRepository,
    private readonly uploads: UploadRepository,
    private readonly errors: ValidationErrorRepository,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    uploadId: string,
    query: GetValidationErrorsQuery,
  ): Promise<PaginatedValidationErrors> {
    const source = await this.sources.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const upload = await this.uploads.findById(uploadId);
    if (!upload || upload.sourceId !== sourceId) {
      throw new NotFoundError("Upload", uploadId);
    }

    return this.errors.findAll({ uploadId, ...query });
  }
}
