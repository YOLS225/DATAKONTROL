import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type {
  PaginatedUploads,
  UploadRepository,
} from "../../../domain/ports/repositories/upload.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";

export interface GetUploadsQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export class GetUploadsUseCase {
  constructor(
    private readonly sources: SourceRepository,
    private readonly uploads: UploadRepository,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    query: GetUploadsQuery,
  ): Promise<PaginatedUploads> {
    const source = await this.sources.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    return this.uploads.findAll({ sourceId, ...query });
  }
}
