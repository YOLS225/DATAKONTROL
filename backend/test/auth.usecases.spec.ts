import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { LoginUseCase } from "../src/application/use-cases/auth/login.usecase.js";
import { LogoutUseCase } from "../src/application/use-cases/auth/logout.usecase.js";
import { RefreshTokenUseCase } from "../src/application/use-cases/auth/refresh-token.usecase.js";
import { UnauthorizedError } from "../src/common/exceptions/unauthorized.js";
import { User } from "../src/domain/entities/user.entity.js";
import { UserRepository } from "../src/domain/ports/repositories/user.repository.js";
import { AuthTokenService } from "../src/domain/ports/services/auth-token.service.js";
import { PasswordHasher } from "../src/domain/ports/services/password-hasher.js";
import { TokenHasher } from "../src/domain/ports/services/token-hasher.js";

describe("authentication use cases", () => {
  const tokens = {
    accessToken: "access-token",
    refreshToken: "new-refresh-token",
  };

  let users: Mocked<UserRepository>;
  let passwordHasher: Mocked<PasswordHasher>;
  let tokenService: Mocked<AuthTokenService>;
  let tokenHasher: Mocked<TokenHasher>;

  beforeEach(() => {
    users = {
      save: jest.fn(),
      updateRefreshToken: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      match: jest.fn(),
    };
    tokenService = {
      generate: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    tokenHasher = {
      hash: jest.fn(),
      match: jest.fn(),
    };
  });

  it("logs in with valid credentials and stores the refresh token hash", async () => {
    const user = createUser();
    users.findByEmail.mockResolvedValue(user);
    passwordHasher.match.mockResolvedValue(true);
    tokenHasher.hash.mockReturnValue("new-refresh-hash");
    tokenService.generate.mockReturnValue(tokens);

    const session = await new LoginUseCase(
      users,
      passwordHasher,
      tokenService,
      tokenHasher,
    ).execute({ email: user.email, password: "correct-password" });

    expect(session).toEqual({
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    });
    expect(users.updateRefreshToken).toHaveBeenCalledWith(
      user.id,
      "new-refresh-hash",
    );
  });

  it("rejects unknown users without checking a password", async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      new LoginUseCase(
        users,
        passwordHasher,
        tokenService,
        tokenHasher,
      ).execute({
        email: "unknown@example.com",
        password: "password",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(passwordHasher.match).not.toHaveBeenCalled();
  });

  it("rotates a valid refresh token", async () => {
    const user = createUser("stored-refresh-hash");
    tokenService.verifyRefreshToken.mockReturnValue({
      userId: user.id,
      email: user.email,
    });
    users.findById.mockResolvedValue(user);
    tokenHasher.match.mockReturnValue(true);
    tokenHasher.hash.mockReturnValue("rotated-refresh-hash");
    tokenService.generate.mockReturnValue(tokens);

    const session = await new RefreshTokenUseCase(
      users,
      tokenService,
      tokenHasher,
    ).execute("current-refresh-token");

    expect(session.refreshToken).toBe(tokens.refreshToken);
    expect(users.updateRefreshToken).toHaveBeenCalledWith(
      user.id,
      "rotated-refresh-hash",
    );
  });

  it("rejects an invalid refresh token", async () => {
    tokenService.verifyRefreshToken.mockReturnValue(null);

    await expect(
      new RefreshTokenUseCase(users, tokenService, tokenHasher).execute(
        "invalid-token",
      ),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(users.findById).not.toHaveBeenCalled();
  });

  it("logs out by clearing the stored refresh token hash", async () => {
    const user = createUser("stored-refresh-hash");
    tokenService.verifyRefreshToken.mockReturnValue({
      userId: user.id,
      email: user.email,
    });
    users.findById.mockResolvedValue(user);
    tokenHasher.match.mockReturnValue(true);

    await new LogoutUseCase(users, tokenService, tokenHasher).execute(
      "current-refresh-token",
    );

    expect(users.updateRefreshToken).toHaveBeenCalledWith(user.id, null);
  });

  function createUser(refreshTokenHash: string | null = null): User {
    return new User(
      "user-id",
      "yoann@example.com",
      "Yoann",
      "password-hash",
      new Date("2026-01-01T00:00:00.000Z"),
      refreshTokenHash,
    );
  }
});
