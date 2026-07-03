import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { CreateSourceUseCase } from "../src/application/use-cases/sources/create-source.usecase.js";
import { ConflictException } from "../src/common/exceptions/conflict.js";
import { NotFoundError } from "../src/common/exceptions/not_found.js";
import { Source } from "../src/domain/entities/source.entity.js";
import { User } from "../src/domain/entities/user.entity.js";
import { SourceRepository } from "../src/domain/ports/repositories/source.repository.js";
import { UserRepository } from "../src/domain/ports/repositories/user.repository.js";

describe("CreateSourceUseCase", () => {
  const user = new User(
    "user-id",
    "yoann@example.com",
    "Yoann",
    "password-hash",
  );

  let users: Mocked<UserRepository>;
  let sources: Mocked<SourceRepository>;
  let useCase: CreateSourceUseCase;

  beforeEach(() => {
    users = {
      save: jest.fn(),
      updateRefreshToken: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    sources = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new CreateSourceUseCase(users, sources);
  });

  it("rejects an unknown user", async () => {
    users.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("unknown-user", {
        name: "ODCI-Hebdo",
        description: "Weekly report",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(sources.findByName).not.toHaveBeenCalled();
    expect(sources.save).not.toHaveBeenCalled();
  });

  it("rejects a duplicate name for the same user", async () => {
    users.findById.mockResolvedValue(user);
    sources.findByName.mockResolvedValue(
      new Source("source-id", "ODCI-Hebdo", "Weekly report", user.id),
    );

    await expect(
      useCase.execute(user.id, {
        name: "ODCI-Hebdo",
        description: "Weekly report",
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(sources.findByName).toHaveBeenCalledWith(user.id, "ODCI-Hebdo");
    expect(sources.save).not.toHaveBeenCalled();
  });

  it("creates a source for an existing user", async () => {
    users.findById.mockResolvedValue(user);
    sources.findByName.mockResolvedValue(null);

    await useCase.execute(user.id, {
      name: "ODCI-Hebdo",
      description: "Weekly report",
    });

    expect(sources.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        name: "ODCI-Hebdo",
        description: "Weekly report",
        userId: user.id,
        createdAt: expect.any(Date),
      }),
    );
  });
});
