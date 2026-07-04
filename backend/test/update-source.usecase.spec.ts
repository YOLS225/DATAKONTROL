import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { UpdateSourcesUsecase } from "../src/application/use-cases/sources/update-sources.usecase.js";
import { ConflictException } from "../src/common/exceptions/conflict.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { Source } from "../src/domain/entities/source.entity.js";
import { SourceRepository } from "../src/domain/ports/repositories/source.repository.js";

describe("UpdateSourcesUsecase", () => {
  const source = new Source(
    "source-id",
    "ODCI-Hebdo",
    "Weekly report",
    "user-id",
  );

  let sources: Mocked<SourceRepository>;
  let useCase: UpdateSourcesUsecase;

  beforeEach(() => {
    sources = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new UpdateSourcesUsecase(sources);
  });

  it("rejects an unknown source", async () => {
    sources.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("user-id", "unknown-source", { name: "New name" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(sources.update).not.toHaveBeenCalled();
  });

  it("does not update another user's source", async () => {
    sources.findById.mockResolvedValue(source);

    await expect(
      useCase.execute("another-user", source.id, { name: "New name" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(sources.update).not.toHaveBeenCalled();
  });

  it("rejects a duplicate name for the same user", async () => {
    sources.findById.mockResolvedValue(source);
    sources.findByName.mockResolvedValue(
      new Source("other-source", "New name", "Description", source.userId),
    );

    await expect(
      useCase.execute(source.userId, source.id, { name: "New name" }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(sources.update).not.toHaveBeenCalled();
  });

  it("updates only the provided fields", async () => {
    sources.findById.mockResolvedValue(source);

    await useCase.execute(source.userId, source.id, {
      description: "Updated report",
    });

    expect(sources.findByName).not.toHaveBeenCalled();
    expect(sources.update).toHaveBeenCalledWith(source.id, {
      description: "Updated report",
    });
  });
});
