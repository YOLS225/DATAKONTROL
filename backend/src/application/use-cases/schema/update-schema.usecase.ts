import { ConflictException } from "../../../common/exceptions/conflict.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { SchemaDefinition } from "../../../domain/entities/schema.entity.js";
import type { SchemaVersionRepository } from "../../../domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import { validateSchemaDefinition } from "./schema-definition.validator.js";

export class UpdateSchemaUseCase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly schemaRepository: SchemaVersionRepository,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    id: string,
    definition: SchemaDefinition,
  ): Promise<void> {
    const source = await this.sourceRepository.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const schema = await this.schemaRepository.findById(id);
    if (!schema || schema.sourceId !== sourceId) {
      throw new NotFoundError("Schema version", id);
    }
    if (schema.publishedAt !== null) {
      throw new ConflictException("A published schema cannot be modified");
    }

    validateSchemaDefinition(definition);
    const updated = await this.schemaRepository.updateDefinition(
      id,
      definition,
    );
    if (!updated) {
      throw new ConflictException("Schema draft can no longer be modified");
    }
  }
}
