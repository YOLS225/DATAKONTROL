export const AUTH_TOKEN_SERVICE = Symbol("AUTH_TOKEN_SERVICE");

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthTokenService {
  generate(payload: AuthTokenPayload): AuthTokens;
  verifyAccessToken(token: string): AuthTokenPayload | null;
  verifyRefreshToken(token: string): AuthTokenPayload | null;
}
