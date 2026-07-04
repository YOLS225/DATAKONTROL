import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { SchemaVersion } from "../../../domain/entities/schema.entity.js";
import type { SchemaVersionRepository } from "../../../domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";

export class GetSchemaUseCase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly schemaRepository: SchemaVersionRepository,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    id: string,
  ): Promise<SchemaVersion> {
    const source = await this.sourceRepository.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const schemaVersion = await this.schemaRepository.findById(id);
    if (!schemaVersion || schemaVersion.sourceId !== sourceId) {
      throw new NotFoundError("Schema version", id);
    }

    return schemaVersion;
  }
}
