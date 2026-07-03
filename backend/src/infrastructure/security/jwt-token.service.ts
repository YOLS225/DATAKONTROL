import { randomUUID } from "node:crypto";
import { sign, SignOptions, verify } from "jsonwebtoken";
import {
  AuthTokenPayload,
  AuthTokens,
  AuthTokenService,
} from "../../domain/ports/services/auth-token.service.js";

interface JwtPayload {
  sub: string;
  email: string;
  type: "access" | "refresh";
}

export class JwtTokenService implements AuthTokenService {
  constructor(
    private readonly accessSecret: string,
    private readonly refreshSecret: string,
    private readonly accessExpiresIn: SignOptions["expiresIn"] = "15m",
    private readonly refreshExpiresIn: SignOptions["expiresIn"] = "7d",
  ) {}

  generate(payload: AuthTokenPayload): AuthTokens {
    return {
      accessToken: sign(
        { email: payload.email, type: "access" },
        this.accessSecret,
        {
          subject: payload.userId,
          expiresIn: this.accessExpiresIn,
          jwtid: randomUUID(),
        },
      ),
      refreshToken: sign(
        { email: payload.email, type: "refresh" },
        this.refreshSecret,
        {
          subject: payload.userId,
          expiresIn: this.refreshExpiresIn,
          jwtid: randomUUID(),
        },
      ),
    };
  }

  verifyAccessToken(token: string): AuthTokenPayload | null {
    return this.verifyToken(token, this.accessSecret, "access");
  }

  verifyRefreshToken(token: string): AuthTokenPayload | null {
    return this.verifyToken(token, this.refreshSecret, "refresh");
  }

  private verifyToken(
    token: string,
    secret: string,
    expectedType: JwtPayload["type"],
  ): AuthTokenPayload | null {
    try {
      const payload = verify(token, secret) as JwtPayload;
      if (payload.type !== expectedType || !payload.sub || !payload.email) {
        return null;
      }
      return { userId: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }
}
