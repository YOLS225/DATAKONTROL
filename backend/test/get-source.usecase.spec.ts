import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { GetSourceUseCase } from "../src/application/use-cases/sources/get-source.usecase.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { Source } from "../src/domain/entities/source.entity.js";
import type { SourceRepository } from "../src/domain/ports/repositories/source.repository.js";

describe("GetSourceUseCase", () => {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const updatedAt = new Date("2026-01-02T00:00:00.000Z");
  const source = new Source(
    "source-id",
    "ODCI-Hebdo",
    "Weekly report",
    "user-id",
    createdAt,
    2,
    updatedAt,
  );

  let sources: Mocked<SourceRepository>;
  let useCase: GetSourceUseCase;

  beforeEach(() => {
    sources = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new GetSourceUseCase(sources);
  });

  it("returns an owned source", async () => {
    sources.findById.mockResolvedValue(source);

    await expect(useCase.execute(source.userId, source.id)).resolves.toEqual({
      id: source.id,
      name: source.name,
      description: source.description,
      currentSchemaVer: 2,
      createdAt,
      updatedAt,
    });
  });

  it("rejects an unknown source", async () => {
    sources.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("user-id", "unknown-source"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("does not expose another user's source", async () => {
    sources.findById.mockResolvedValue(source);

    await expect(
      useCase.execute("another-user", source.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
