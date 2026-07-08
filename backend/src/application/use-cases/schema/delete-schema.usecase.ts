import { ConflictException } from "../../../common/exceptions/conflict.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { SchemaVersionRepository } from "../../../domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";

export class DeleteSchemaUseCase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly schemaRepository: SchemaVersionRepository,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    schemaVersionId: string,
  ): Promise<void> {
    const source = await this.sourceRepository.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const schema = await this.schemaRepository.findById(schemaVersionId);
    if (!schema || schema.sourceId !== sourceId) {
      throw new NotFoundError("Schema version", schemaVersionId);
    }

    if (schema.isActive || schema.publishedAt) {
      throw new ConflictException("Published schema cannot be deleted");
    }

    const deleted = await this.schemaRepository.deleteDraft(schemaVersionId);
    if (!deleted) {
      throw new ConflictException("Schema draft can no longer be deleted");
    }
  }
}
