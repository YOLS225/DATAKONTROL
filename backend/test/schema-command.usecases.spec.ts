import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { PublishSchemaUseCase } from "../src/application/use-cases/schema/publish-schema.usecase.js";
import { UpdateSchemaUseCase } from "../src/application/use-cases/schema/update-schema.usecase.js";
import { ConflictException } from "../src/common/exceptions/conflict.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { SchemaVersion } from "../src/domain/entities/schema.entity.js";
import { Source } from "../src/domain/entities/source.entity.js";
import type { SchemaVersionRepository } from "../src/domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../src/domain/ports/repositories/source.repository.js";

describe("Schema command use cases", () => {
  const source = new Source(
    "source-id",
    "ODCI-Hebdo",
    "Weekly report",
    "user-id",
  );
  const definition = {
    columns: [
      {
        id: "customer-email",
        name: "email",
        type: "string" as const,
        required: true,
      },
    ],
  };
  const draft = new SchemaVersion(
    "schema-id",
    source.id,
    1,
    definition,
    source.userId,
  );

  let sources: Mocked<SourceRepository>;
  let schemas: Mocked<SchemaVersionRepository>;

  beforeEach(() => {
    sources = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    schemas = {
      createDraft: jest.fn(),
      findById: jest.fn(),
      findActiveBySourceId: jest.fn(),
      findDraftBySourceId: jest.fn(),
      findLatestVersionNumber: jest.fn(),
      findAll: jest.fn(),
      updateDefinition: jest.fn(),
      publish: jest.fn(),
    };
  });

  it("updates an owned draft", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findById.mockResolvedValue(draft);
    schemas.updateDefinition.mockResolvedValue(true);
    const useCase = new UpdateSchemaUseCase(sources, schemas);

    await useCase.execute(source.userId, source.id, draft.id, definition);

    expect(schemas.updateDefinition).toHaveBeenCalledWith(draft.id, definition);
  });

  it("does not modify a published schema", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findById.mockResolvedValue(
      new SchemaVersion(
        draft.id,
        source.id,
        1,
        definition,
        source.userId,
        true,
        new Date(),
        new Date(),
      ),
    );
    const useCase = new UpdateSchemaUseCase(sources, schemas);

    await expect(
      useCase.execute(source.userId, source.id, draft.id, definition),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(schemas.updateDefinition).not.toHaveBeenCalled();
  });

  it("does not update another user's schema", async () => {
    sources.findById.mockResolvedValue(source);
    const useCase = new UpdateSchemaUseCase(sources, schemas);

    await expect(
      useCase.execute("another-user", source.id, draft.id, definition),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("publishes a valid draft", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findById.mockResolvedValue(draft);
    schemas.publish.mockResolvedValue(true);
    const useCase = new PublishSchemaUseCase(sources, schemas);

    await useCase.execute(source.userId, source.id, draft.id);

    expect(schemas.publish).toHaveBeenCalledWith(
      source.id,
      draft.id,
      draft.version,
      expect.any(Date),
    );
  });

  it("does not publish an empty schema", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findById.mockResolvedValue(
      new SchemaVersion(draft.id, source.id, 1, { columns: [] }, source.userId),
    );
    const useCase = new PublishSchemaUseCase(sources, schemas);

    await expect(
      useCase.execute(source.userId, source.id, draft.id),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(schemas.publish).not.toHaveBeenCalled();
  });

  it("rejects publication when the draft changed concurrently", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findById.mockResolvedValue(draft);
    schemas.publish.mockResolvedValue(false);
    const useCase = new PublishSchemaUseCase(sources, schemas);

    await expect(
      useCase.execute(source.userId, source.id, draft.id),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
