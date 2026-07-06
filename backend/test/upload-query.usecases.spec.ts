import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { GetUploadUseCase } from "../src/application/use-cases/uploads/get-upload.usecase.js";
import { GetUploadsUseCase } from "../src/application/use-cases/uploads/get-uploads.usecase.js";
import { GetValidationErrorsUseCase } from "../src/application/use-cases/uploads/get-validation-errors.usecase.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { Source } from "../src/domain/entities/source.entity.js";
import { Upload } from "../src/domain/entities/upload.entity.js";
import type { SourceRepository } from "../src/domain/ports/repositories/source.repository.js";
import type { UploadRepository } from "../src/domain/ports/repositories/upload.repository.js";
import type { ValidationErrorRepository } from "../src/domain/ports/repositories/validation-error.repository.js";

describe("Upload query use cases", () => {
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
  let errors: Mocked<ValidationErrorRepository>;

  beforeEach(() => {
    sources = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
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
    errors = {
      saveMany: jest.fn(),
      deleteByUploadId: jest.fn(),
      findAll: jest.fn(),
    };
  });

  it("lists uploads only for an owned source", async () => {
    sources.findById.mockResolvedValue(source);
    uploads.findAll.mockResolvedValue({
      content: [upload],
      total: 1,
      page: 2,
      page_size: 10,
    });
    const useCase = new GetUploadsUseCase(sources, uploads);

    await useCase.execute(source.userId, source.id, {
      page: 2,
      pageSize: 10,
      search: "customers",
    });

    expect(uploads.findAll).toHaveBeenCalledWith({
      sourceId: source.id,
      page: 2,
      pageSize: 10,
      search: "customers",
    });
  });

  it("does not list uploads from another user's source", async () => {
    sources.findById.mockResolvedValue(source);
    const useCase = new GetUploadsUseCase(sources, uploads);

    await expect(
      useCase.execute("another-user", source.id, { page: 1, pageSize: 20 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(uploads.findAll).not.toHaveBeenCalled();
  });

  it("returns an upload belonging to the requested source", async () => {
    sources.findById.mockResolvedValue(source);
    uploads.findById.mockResolvedValue(upload);
    const useCase = new GetUploadUseCase(sources, uploads);

    await expect(
      useCase.execute(source.userId, source.id, upload.id),
    ).resolves.toBe(upload);
  });

  it("does not expose an upload through another source", async () => {
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
    const useCase = new GetUploadUseCase(sources, uploads);

    await expect(
      useCase.execute(source.userId, source.id, upload.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("paginates validation errors for an owned upload", async () => {
    sources.findById.mockResolvedValue(source);
    uploads.findById.mockResolvedValue(upload);
    errors.findAll.mockResolvedValue({
      content: [],
      total: 0,
      page: 1,
      page_size: 20,
    });
    const useCase = new GetValidationErrorsUseCase(sources, uploads, errors);

    await useCase.execute(source.userId, source.id, upload.id, {
      page: 1,
      pageSize: 20,
    });

    expect(errors.findAll).toHaveBeenCalledWith({
      uploadId: upload.id,
      page: 1,
      pageSize: 20,
    });
  });

  it("does not list errors when the upload is not in the source", async () => {
    sources.findById.mockResolvedValue(source);
    uploads.findById.mockResolvedValue(null);
    const useCase = new GetValidationErrorsUseCase(sources, uploads, errors);

    await expect(
      useCase.execute(source.userId, source.id, "missing-upload", {
        page: 1,
        pageSize: 20,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(errors.findAll).not.toHaveBeenCalled();
  });
});
