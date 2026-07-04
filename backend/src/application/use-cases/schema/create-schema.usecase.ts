import { ConflictException } from "../../../common/exceptions/conflict.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import { SchemaVersion } from "../../../domain/entities/schema.entity.js";
import type { SchemaDefinition } from "../../../domain/entities/schema.entity.js";
import type { SchemaVersionRepository } from "../../../domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import { validateSchemaDefinition } from "./schema-definition.validator.js";

export class CreateSchemaUsecase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly schemaVersionRepository: SchemaVersionRepository,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    schemaDefinition: SchemaDefinition = { columns: [] },
  ): Promise<SchemaVersion> {
    validateSchemaDefinition(schemaDefinition);

    const source = await this.sourceRepository.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const existingDraft =
      await this.schemaVersionRepository.findDraftBySourceId(sourceId);
    if (existingDraft) {
      throw new ConflictException("A schema draft already exists");
    }

    const latestVersion =
      await this.schemaVersionRepository.findLatestVersionNumber(sourceId);
    const schema = new SchemaVersion(
      crypto.randomUUID(),
      sourceId,
      (latestVersion ?? 0) + 1,
      schemaDefinition,
      userId,
    );

    await this.schemaVersionRepository.createDraft(schema);
    return schema;
  }
}
