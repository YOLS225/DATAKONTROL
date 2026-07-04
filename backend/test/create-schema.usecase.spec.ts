import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { CreateSchemaUsecase } from "../src/application/use-cases/schema/create-schema.usecase.js";
import { ConflictException } from "../src/common/exceptions/conflict.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { SchemaVersion } from "../src/domain/entities/schema.entity.js";
import { Source } from "../src/domain/entities/source.entity.js";
import type { SchemaVersionRepository } from "../src/domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../src/domain/ports/repositories/source.repository.js";

describe("CreateSchemaUsecase", () => {
  const source = new Source(
    "source-id",
    "ODCI-Hebdo",
    "Weekly report",
    "user-id",
  );

  let sources: Mocked<SourceRepository>;
  let schemas: Mocked<SchemaVersionRepository>;
  let useCase: CreateSchemaUsecase;

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
      findDraftBySourceId: jest.fn(),
      findLatestVersionNumber: jest.fn(),
      findAll: jest.fn(),
      updateDefinition: jest.fn(),
      publish: jest.fn(),
    };
    useCase = new CreateSchemaUsecase(sources, schemas);
  });

  it("does not create a schema for another user's source", async () => {
    sources.findById.mockResolvedValue(source);

    await expect(
      useCase.execute("another-user", source.id),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(schemas.createDraft).not.toHaveBeenCalled();
  });

  it("rejects a second draft for the same source", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findDraftBySourceId.mockResolvedValue(
      new SchemaVersion(
        "draft-id",
        source.id,
        1,
        { columns: [] },
        source.userId,
      ),
    );

    await expect(
      useCase.execute(source.userId, source.id),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(schemas.createDraft).not.toHaveBeenCalled();
  });

  it("creates the next schema version as a draft", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findDraftBySourceId.mockResolvedValue(null);
    schemas.findLatestVersionNumber.mockResolvedValue(2);

    const result = await useCase.execute(source.userId, source.id, {
      columns: [
        {
          id: "customer-email",
          name: "email",
          type: "string",
          required: true,
        },
      ],
    });

    expect(result).toEqual(
      expect.objectContaining({
        sourceId: source.id,
        version: 3,
        createdBy: source.userId,
        isActive: false,
        publishedAt: null,
      }),
    );
    expect(schemas.createDraft).toHaveBeenCalledWith(result);
  });
});
