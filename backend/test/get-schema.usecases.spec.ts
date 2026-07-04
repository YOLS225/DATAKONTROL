import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { GetSchemaUseCase } from "../src/application/use-cases/schema/get-schema.usecase.js";
import { GetSchemasUsecase } from "../src/application/use-cases/schema/get-schemas.usecase.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { SchemaVersion } from "../src/domain/entities/schema.entity.js";
import { Source } from "../src/domain/entities/source.entity.js";
import type { SchemaVersionRepository } from "../src/domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../src/domain/ports/repositories/source.repository.js";

describe("Schema query use cases", () => {
  const source = new Source(
    "source-id",
    "ODCI-Hebdo",
    "Weekly report",
    "user-id",
  );
  const schema = new SchemaVersion(
    "schema-id",
    source.id,
    1,
    { columns: [] },
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
      findDraftBySourceId: jest.fn(),
      findLatestVersionNumber: jest.fn(),
      findAll: jest.fn(),
      updateDefinition: jest.fn(),
      publish: jest.fn(),
    };
  });

  it("returns an owned schema version", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findById.mockResolvedValue(schema);
    const useCase = new GetSchemaUseCase(sources, schemas);

    await expect(
      useCase.execute(source.userId, source.id, schema.id),
    ).resolves.toBe(schema);
  });

  it("does not expose a schema from another source", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findById.mockResolvedValue(
      new SchemaVersion(
        "schema-id",
        "another-source",
        1,
        { columns: [] },
        source.userId,
      ),
    );
    const useCase = new GetSchemaUseCase(sources, schemas);

    await expect(
      useCase.execute(source.userId, source.id, "schema-id"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists schema versions for an owned source", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findAll.mockResolvedValue({
      content: [schema],
      total: 1,
      page: 1,
      page_size: 20,
    });
    const useCase = new GetSchemasUsecase(sources, schemas);

    await useCase.execute(source.userId, source.id, {
      page: 1,
      pageSize: 20,
    });

    expect(schemas.findAll).toHaveBeenCalledWith({
      sourceId: source.id,
      page: 1,
      pageSize: 20,
    });
  });

  it("does not list another user's schema versions", async () => {
    sources.findById.mockResolvedValue(source);
    const useCase = new GetSchemasUsecase(sources, schemas);

    await expect(
      useCase.execute("another-user", source.id, {
        page: 1,
        pageSize: 20,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(schemas.findAll).not.toHaveBeenCalled();
  });
});
