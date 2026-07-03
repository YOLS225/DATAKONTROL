import { describe, expect, it } from "@jest/globals";
import { JwtTokenService } from "../src/infrastructure/security/jwt-token.service.js";

describe("JwtTokenService", () => {
  it("verifies refresh tokens and rejects access tokens", () => {
    const service = new JwtTokenService(
      "access-secret-with-sufficient-entropy",
      "refresh-secret-with-sufficient-entropy",
    );
    const tokens = service.generate({
      userId: "user-id",
      email: "yoann@example.com",
    });

    expect(service.verifyRefreshToken(tokens.refreshToken)).toEqual({
      userId: "user-id",
      email: "yoann@example.com",
    });
    expect(service.verifyAccessToken(tokens.accessToken)).toEqual({
      userId: "user-id",
      email: "yoann@example.com",
    });
    expect(service.verifyRefreshToken(tokens.accessToken)).toBeNull();
    expect(service.verifyAccessToken(tokens.refreshToken)).toBeNull();
  });

  it("generates a new refresh token on each rotation", () => {
    const service = new JwtTokenService("access-secret", "refresh-secret");
    const payload = { userId: "user-id", email: "yoann@example.com" };

    expect(service.generate(payload).refreshToken).not.toBe(
      service.generate(payload).refreshToken,
    );
  });
});
