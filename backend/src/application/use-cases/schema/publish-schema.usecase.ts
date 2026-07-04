import { ConflictException } from "../../../common/exceptions/conflict.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { SchemaVersionRepository } from "../../../domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import { validateSchemaDefinition } from "./schema-definition.validator.js";

export class PublishSchemaUseCase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly schemaRepository: SchemaVersionRepository,
  ) {}

  async execute(userId: string, sourceId: string, id: string): Promise<void> {
    const source = await this.sourceRepository.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const schema = await this.schemaRepository.findById(id);
    if (!schema || schema.sourceId !== sourceId) {
      throw new NotFoundError("Schema version", id);
    }
    if (schema.publishedAt !== null) {
      throw new ConflictException("Schema version is already published");
    }

    validateSchemaDefinition(schema.schemaDefinition, true);
    const published = await this.schemaRepository.publish(
      sourceId,
      id,
      schema.version,
      new Date(),
    );
    if (!published) {
      throw new ConflictException("Schema draft can no longer be published");
    }
  }
}
