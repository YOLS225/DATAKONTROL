import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Readable } from "node:stream";

import type { Mocked } from "jest-mock";
import { SaveFileUseCase } from "../src/application/use-cases/uploads/save-file.usecase.js";
import { ConflictException } from "../src/common/exceptions/conflict.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { SchemaVersion } from "../src/domain/entities/schema.entity.js";
import { Source } from "../src/domain/entities/source.entity.js";
import type { SchemaVersionRepository } from "../src/domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../src/domain/ports/repositories/source.repository.js";
import type { UploadRepository } from "../src/domain/ports/repositories/upload.repository.js";
import type { FileStorage } from "../src/domain/ports/services/file-storage.js";
import type { UploadQueue } from "../src/domain/ports/services/upload-queue.js";

describe("SaveFileUseCase", () => {
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
    {
      columns: [
        {
          id: "customer-email",
          name: "email",
          type: "string",
          required: true,
        },
      ],
    },
    source.userId,
    true,
    new Date(),
    new Date(),
  );

  let sources: Mocked<SourceRepository>;
  let schemas: Mocked<SchemaVersionRepository>;
  let uploads: Mocked<UploadRepository>;
  let storage: Mocked<FileStorage>;
  let queue: Mocked<UploadQueue>;
  let useCase: SaveFileUseCase;

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
    queue = { enqueue: jest.fn() };
    useCase = new SaveFileUseCase(sources, schemas, uploads, storage, queue);
  });

  function command() {
    return {
      userId: source.userId,
      sourceId: source.id,
      fileName: "customers.csv",
      fileSize: 42,
      fileType: "text/csv",
      stream: Readable.from("email\nyoann@example.com\n"),
    };
  }

  it("does not upload a file for another user's source", async () => {
    sources.findById.mockResolvedValue(source);

    await expect(
      useCase.execute({ ...command(), userId: "another-user" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(schemas.findActiveBySourceId).not.toHaveBeenCalled();
    expect(storage.save).not.toHaveBeenCalled();
  });

  it("requires an active schema", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findActiveBySourceId.mockResolvedValue(null);

    await expect(useCase.execute(command())).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(storage.save).not.toHaveBeenCalled();
  });

  it("stores, persists and enqueues a pending upload", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findActiveBySourceId.mockResolvedValue(schema);

    const result = await useCase.execute(command());

    expect(storage.save).toHaveBeenCalledWith({
      key: `sources/${source.id}/uploads/${result.id}`,
      stream: expect.any(Readable),
      contentType: "text/csv",
      contentLength: 42,
    });
    expect(uploads.save).toHaveBeenCalledWith(result);
    expect(queue.enqueue).toHaveBeenCalledWith(result.id);
  });

  it("deletes the stored file when persistence fails", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findActiveBySourceId.mockResolvedValue(schema);
    uploads.save.mockRejectedValue(new Error("database unavailable"));

    await expect(useCase.execute(command())).rejects.toThrow(
      "database unavailable",
    );

    const storedFile = storage.save.mock.calls[0][0];
    expect(storage.delete).toHaveBeenCalledWith(storedFile.key);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it("marks the upload as failed when enqueueing fails", async () => {
    sources.findById.mockResolvedValue(source);
    schemas.findActiveBySourceId.mockResolvedValue(schema);
    queue.enqueue.mockRejectedValue(new Error("redis unavailable"));

    await expect(useCase.execute(command())).rejects.toThrow(
      "redis unavailable",
    );

    expect(uploads.fail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
    );
  });
});
