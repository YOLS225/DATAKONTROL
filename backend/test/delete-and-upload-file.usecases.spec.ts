import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { DeleteSchemaUseCase } from "../src/application/use-cases/schema/delete-schema.usecase.js";
import { DeleteSourceUseCase } from "../src/application/use-cases/sources/delete-source.usecase.js";
import { GetUploadFileUseCase } from "../src/application/use-cases/uploads/get-upload-file.usecase.js";
import { ConflictException } from "../src/common/exceptions/conflict.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { SchemaVersion } from "../src/domain/entities/schema.entity.js";
import { Source } from "../src/domain/entities/source.entity.js";
import { Upload } from "../src/domain/entities/upload.entity.js";
import type { SchemaVersionRepository } from "../src/domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../src/domain/ports/repositories/source.repository.js";
import type { UploadRepository } from "../src/domain/ports/repositories/upload.repository.js";
import type { FileStorage } from "../src/domain/ports/services/file-storage.js";

describe("Delete source use case", () => {
  const source = new Source(
    "source-id",
    "Customers",
    "Customer records",
    "user-id",
  );
  let sources: Mocked<SourceRepository>;

  beforeEach(() => {
    sources = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      countLinks: jest.fn(),
      delete: jest.fn(),
    };
  });

  it("deletes an owned source without links", async () => {
    sources.findById.mockResolvedValue(source);
    sources.countLinks.mockResolvedValue(0);
    const useCase = new DeleteSourceUseCase(sources);

    await useCase.execute(source.userId, source.id);

    expect(sources.delete).toHaveBeenCalledWith(source.id);
  });

  it("does not delete a linked source", async () => {
    sources.findById.mockResolvedValue(source);
    sources.countLinks.mockResolvedValue(1);
    const useCase = new DeleteSourceUseCase(sources);

    await expect(useCase.execute(source.userId, source.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(sources.delete).not.toHaveBeenCalled();
  });
});

describe("Delete schema use case", () => {
  const source = new Source(
    "source-id",
    "Customers",
    "Customer records",
    "user-id",
  );
  const draft = new SchemaVersion(
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
      countLinks: jest.fn(),
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
      deleteDraft: jest.fn(),
      publish: jest.fn(),
    };
  });

  it("deletes an unpublished schema draft", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findById.mockResolvedValue(draft);
    schemas.deleteDraft.mockResolvedValue(true);
    const useCase = new DeleteSchemaUseCase(sources, schemas);

    await useCase.execute(source.userId, source.id, draft.id);

    expect(schemas.deleteDraft).toHaveBeenCalledWith(draft.id);
  });

  it("does not delete a published schema", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findById.mockResolvedValue(
      new SchemaVersion(
        draft.id,
        source.id,
        1,
        draft.schemaDefinition,
        source.userId,
        true,
        new Date(),
        new Date(),
      ),
    );
    const useCase = new DeleteSchemaUseCase(sources, schemas);

    await expect(
      useCase.execute(source.userId, source.id, draft.id),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(schemas.deleteDraft).not.toHaveBeenCalled();
  });
});

describe("Get upload file use case", () => {
  const source = new Source(
    "source-id",
    "Customers",
    "Customer records",
    "user-id",
  );
  const upload = new Upload(
    "upload-id",
    source.id,
    "schema-id",
    source.userId,
    "customers.csv",
    42,
    "sources/source-id/uploads/upload-id",
    "text/csv",
  );
  let sources: Mocked<SourceRepository>;
  let uploads: Mocked<UploadRepository>;
  let storage: Mocked<FileStorage>;

  beforeEach(() => {
    sources = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      countLinks: jest.fn(),
      delete: jest.fn(),
    };
    uploads = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      markProcessing: jest.fn(),
      fail: jest.fn(),
      complete: jest.fn(),
    };
    storage = {
      save: jest.fn(),
      read: jest.fn(),
      delete: jest.fn(),
    };
  });

  it("returns the uploaded file stream for an owned source", async () => {
    const stream = Readable.from(["email\njohn@example.com\n"]);
    sources.findById.mockResolvedValue(source);
    uploads.findById.mockResolvedValue(upload);
    storage.read.mockResolvedValue(stream);
    const useCase = new GetUploadFileUseCase(sources, uploads, storage);

    await expect(
      useCase.execute(source.userId, source.id, upload.id),
    ).resolves.toEqual({
      stream,
      fileName: upload.fileName,
      fileType: upload.fileType,
      fileSize: upload.fileSize,
    });
    expect(storage.read).toHaveBeenCalledWith(upload.filePath);
  });

  it("does not expose an upload file through another source", async () => {
    sources.findById.mockResolvedValue(source);
    uploads.findById.mockResolvedValue(
      new Upload(
        upload.id,
        "another-source",
        upload.schemaVersionId,
        upload.userId,
        upload.fileName,
        upload.fileSize,
        upload.filePath,
        upload.fileType,
      ),
    );
    const useCase = new GetUploadFileUseCase(sources, uploads, storage);

    await expect(
      useCase.execute(source.userId, source.id, upload.id),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(storage.read).not.toHaveBeenCalled();
  });
});
