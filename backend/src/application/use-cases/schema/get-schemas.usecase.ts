import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type {
  PaginatedSchemaVersions,
  SchemaVersionRepository,
} from "../../../domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";

export interface GetSchemasQuery {
  page: number;
  pageSize: number;
}

export class GetSchemasUsecase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly schemaRepository: SchemaVersionRepository,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    query: GetSchemasQuery,
  ): Promise<PaginatedSchemaVersions> {
    const source = await this.sourceRepository.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    return this.schemaRepository.findAll({ sourceId, ...query });
  }
}
