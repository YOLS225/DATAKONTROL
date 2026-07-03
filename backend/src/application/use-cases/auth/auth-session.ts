import { AuthTokens } from "../../../domain/ports/services/auth-token.service.js";
import { User } from "../../../domain/entities/user.entity.js";

export interface AuthSession extends AuthTokens {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export function createAuthSession(user: User, tokens: AuthTokens): AuthSession {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    ...tokens,
  };
}
