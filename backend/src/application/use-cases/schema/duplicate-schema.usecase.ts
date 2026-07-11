import { ConflictException } from "../../../common/exceptions/conflict.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import { SchemaVersion } from "../../../domain/entities/schema.entity.js";
import type { SchemaVersionRepository } from "../../../domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import { validateSchemaDefinition } from "./schema-definition.validator.js";

export class DuplicateSchemaUseCase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly schemaVersionRepository: SchemaVersionRepository,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    schemaVersionId: string,
  ): Promise<SchemaVersion> {
    const source = await this.sourceRepository.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const sourceSchema =
      await this.schemaVersionRepository.findById(schemaVersionId);
    if (!sourceSchema || sourceSchema.sourceId !== sourceId) {
      throw new NotFoundError("Schema version", schemaVersionId);
    }

    const existingDraft =
      await this.schemaVersionRepository.findDraftBySourceId(sourceId);
    if (existingDraft) {
      throw new ConflictException("A schema draft already exists");
    }

    validateSchemaDefinition(sourceSchema.schemaDefinition);

    const latestVersion =
      await this.schemaVersionRepository.findLatestVersionNumber(sourceId);
    const duplicatedSchema = new SchemaVersion(
      crypto.randomUUID(),
      sourceId,
      (latestVersion ?? 0) + 1,
      structuredClone(sourceSchema.schemaDefinition),
      userId,
    );

    await this.schemaVersionRepository.createDraft(duplicatedSchema);
    return duplicatedSchema;
  }
}
