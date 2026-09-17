import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { LoginUseCase } from "../src/application/use-cases/auth/login.usecase.js";
import { LogoutUseCase } from "../src/application/use-cases/auth/logout.usecase.js";
import { ForgotPasswordUseCase } from "../src/application/use-cases/auth/forgot-password.usecase.js";
import { RefreshTokenUseCase } from "../src/application/use-cases/auth/refresh-token.usecase.js";
import { ResetPasswordUseCase } from "../src/application/use-cases/auth/reset-password.usecase.js";
import { UnauthorizedError } from "../src/common/exceptions/unauthorized.js";
import { User } from "../src/domain/entities/user.entity.js";
import { UserRepository } from "../src/domain/ports/repositories/user.repository.js";
import { AuthTokenService } from "../src/domain/ports/services/auth-token.service.js";
import { PasswordHasher } from "../src/domain/ports/services/password-hasher.js";
import { TokenHasher } from "../src/domain/ports/services/token-hasher.js";
import type { ConfigService } from "@nestjs/config";

describe("authentication use cases", () => {
  const tokens = {
    accessToken: "access-token",
    refreshToken: "new-refresh-token",
  };

  let users: Mocked<UserRepository>;
  let passwordHasher: Mocked<PasswordHasher>;
  let tokenService: Mocked<AuthTokenService>;
  let tokenHasher: Mocked<TokenHasher>;
  let config: Mocked<Pick<ConfigService, "get">>;

  beforeEach(() => {
    users = {
      save: jest.fn(),
      updateRefreshToken: jest.fn(),
      updatePasswordResetToken: jest.fn(),
      updatePassword: jest.fn(),
      findByPasswordResetTokenHash: jest.fn(),
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
    config = {
      get: jest.fn(),
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

  it("creates a password reset token for an existing user in non-production", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    const user = createUser();
    users.findByEmail.mockResolvedValue(user);
    tokenHasher.hash.mockReturnValue("reset-token-hash");
    config.get.mockImplementation((key: string) => {
      if (key === "NODE_ENV") return "test";
      return undefined;
    });

    const result = await new ForgotPasswordUseCase(
      users,
      tokenHasher,
      config as ConfigService,
    ).execute(user.email);

    expect(result.resetToken).toBeDefined();
    expect(users.updatePasswordResetToken).toHaveBeenCalledWith(
      user.id,
      "reset-token-hash",
      new Date("2026-09-15T12:15:00.000Z"),
    );
    jest.useRealTimers();
  });

  it("does not reveal if a password reset email is unknown", async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      new ForgotPasswordUseCase(
        users,
        tokenHasher,
        config as ConfigService,
      ).execute("unknown@example.com"),
    ).resolves.toEqual({});

    expect(users.updatePasswordResetToken).not.toHaveBeenCalled();
  });

  it("resets a password with a valid reset token", async () => {
    const user = createUser(
      "stored-refresh-hash",
      "reset-token-hash",
      new Date("2026-09-15T12:30:00.000Z"),
    );
    jest.useFakeTimers().setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    tokenHasher.hash.mockReturnValue("reset-token-hash");
    users.findByPasswordResetTokenHash.mockResolvedValue(user);
    passwordHasher.hash.mockResolvedValue("new-password-hash");

    await new ResetPasswordUseCase(users, passwordHasher, tokenHasher).execute({
      resetToken: "reset-token",
      password: "new-password",
    });

    expect(users.updatePassword).toHaveBeenCalledWith(
      user.id,
      "new-password-hash",
    );
    jest.useRealTimers();
  });

  it("rejects an expired reset token and clears it", async () => {
    const user = createUser(
      "stored-refresh-hash",
      "reset-token-hash",
      new Date("2026-09-15T11:59:00.000Z"),
    );
    jest.useFakeTimers().setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    tokenHasher.hash.mockReturnValue("reset-token-hash");
    users.findByPasswordResetTokenHash.mockResolvedValue(user);

    await expect(
      new ResetPasswordUseCase(users, passwordHasher, tokenHasher).execute({
        resetToken: "reset-token",
        password: "new-password",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(users.updatePasswordResetToken).toHaveBeenCalledWith(
      user.id,
      null,
      null,
    );
    expect(users.updatePassword).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  function createUser(
    refreshTokenHash: string | null = null,
    passwordResetTokenHash: string | null = null,
    passwordResetTokenExpiresAt: Date | null = null,
  ): User {
    return new User(
      "user-id",
      "yoann@example.com",
      "Yoann",
      "password-hash",
      new Date("2026-01-01T00:00:00.000Z"),
      refreshTokenHash,
      passwordResetTokenHash,
      passwordResetTokenExpiresAt,
    );
  }
});
