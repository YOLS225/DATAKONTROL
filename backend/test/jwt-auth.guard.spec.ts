import { describe, expect, it, jest } from "@jest/globals";
import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Mocked } from "jest-mock";
import { AuthTokenService } from "../src/domain/ports/services/auth-token.service.js";
import { JwtAuthGuard } from "../src/presentation/guards/jwt-auth.guard.js";

describe("JwtAuthGuard", () => {
  it("attaches the authenticated user to the request", () => {
    const tokenService = createTokenService();
    tokenService.verifyAccessToken.mockReturnValue({
      userId: "user-id",
      email: "yoann@example.com",
    });
    const request: {
      headers: { authorization: string };
      user?: { userId: string; email: string };
    } = { headers: { authorization: "Bearer access-token" } };

    const result = new JwtAuthGuard(tokenService).canActivate(
      createContext(request),
    );

    expect(result).toBe(true);
    expect(request.user).toEqual({
      userId: "user-id",
      email: "yoann@example.com",
    });
  });

  it("rejects requests without a bearer token", () => {
    const guard = new JwtAuthGuard(createTokenService());

    expect(() => guard.canActivate(createContext({ headers: {} }))).toThrow(
      UnauthorizedException,
    );
  });

  function createTokenService(): Mocked<AuthTokenService> {
    return {
      generate: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
  }

  function createContext(request: object): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
    } as unknown as ExecutionContext;
  }
});
