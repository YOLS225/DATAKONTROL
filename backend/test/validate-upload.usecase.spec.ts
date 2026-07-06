import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { ValidateUploadUseCase } from "../src/application/use-cases/uploads/validate-upload.usecase.js";
import { SchemaVersion } from "../src/domain/entities/schema.entity.js";
import { Upload, UploadStatus } from "../src/domain/entities/upload.entity.js";
import type { SchemaVersionRepository } from "../src/domain/ports/repositories/schema.repository.js";
import type { UploadRepository } from "../src/domain/ports/repositories/upload.repository.js";
import type { ValidationErrorRepository } from "../src/domain/ports/repositories/validation-error.repository.js";
import type { FileParser } from "../src/domain/ports/services/file-parser.js";
import type { FileStorage } from "../src/domain/ports/services/file-storage.js";

describe("ValidateUploadUseCase", () => {
  const upload = new Upload(
    "upload-id",
    "source-id",
    "schema-id",
    "user-id",
    "customers.csv",
    42,
    "sources/source-id/uploads/upload-id",
    "text/csv",
  );
  const schema = new SchemaVersion(
    "schema-id",
    "source-id",
    1,
    {
      columns: [
        { id: "email", name: "email", type: "string", required: true },
        { id: "age", name: "age", type: "integer", required: true },
      ],
    },
    "user-id",
    true,
    new Date(),
    new Date(),
  );

  let uploads: Mocked<UploadRepository>;
  let schemas: Mocked<SchemaVersionRepository>;
  let errors: Mocked<ValidationErrorRepository>;
  let storage: Mocked<FileStorage>;
  let parser: Mocked<FileParser>;
  let useCase: ValidateUploadUseCase;

  beforeEach(() => {
    uploads = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      markProcessing: jest.fn(),
      fail: jest.fn(),
      complete: jest.fn(),
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
    errors = {
      saveMany: jest.fn(),
      deleteByUploadId: jest.fn(),
      findAll: jest.fn(),
    };
    storage = {
      save: jest.fn(),
      read: jest.fn(),
      delete: jest.fn(),
    };
    parser = { parse: jest.fn() };
    useCase = new ValidateUploadUseCase(
      uploads,
      schemas,
      errors,
      storage,
      parser,
    );

    uploads.findById.mockResolvedValue(upload);
    uploads.markProcessing.mockResolvedValue(true);
    uploads.complete.mockResolvedValue(true);
    schemas.findById.mockResolvedValue(schema);
    storage.read.mockResolvedValue(Readable.from("csv"));
  });

  it("completes a valid upload", async () => {
    parser.parse.mockReturnValue(
      rows([
        {
          rowNumber: 2,
          values: { email: "yoann@example.com", age: "30" },
        },
        {
          rowNumber: 3,
          values: { email: "dev@example.com", age: "25" },
        },
      ]),
    );

    await useCase.execute(upload.id);

    expect(uploads.markProcessing).toHaveBeenCalledWith(upload.id);
    expect(errors.saveMany).not.toHaveBeenCalled();
    expect(uploads.complete).toHaveBeenCalledWith(
      upload.id,
      { totalRows: 2, validRows: 2, invalidRows: 0 },
      expect.any(Date),
    );
  });

  it("persists header and row validation errors", async () => {
    parser.parse.mockReturnValue(
      rows([
        {
          rowNumber: 2,
          values: { email: "", unexpected: "value" },
        },
      ]),
    );

    await useCase.execute(upload.id);

    expect(errors.saveMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          rowNumber: 1,
          columnName: "age",
          errorType: "MISSING_COLUMN",
        }),
        expect.objectContaining({
          rowNumber: 1,
          columnName: "unexpected",
          errorType: "UNKNOWN_COLUMN",
        }),
        expect.objectContaining({
          rowNumber: 2,
          columnName: "email",
          errorType: "REQUIRED",
        }),
      ]),
    );
    expect(uploads.complete).toHaveBeenCalledWith(
      upload.id,
      { totalRows: 1, validRows: 0, invalidRows: 1 },
      expect.any(Date),
    );
  });

  it("does not reprocess a terminal upload", async () => {
    uploads.findById.mockResolvedValue(
      new Upload(
        upload.id,
        upload.sourceId,
        upload.schemaVersionId,
        upload.userId,
        upload.fileName,
        upload.fileSize,
        upload.filePath,
        upload.fileType,
        UploadStatus.COMPLETED,
      ),
    );

    await useCase.execute(upload.id);

    expect(storage.read).not.toHaveBeenCalled();
    expect(uploads.complete).not.toHaveBeenCalled();
  });
});

async function* rows(
  values: Array<{ rowNumber: number; values: Record<string, string> }>,
) {
  yield* values;
}
