import { UnauthorizedError } from "../../../common/exceptions/unauthorized.js";
import { UserRepository } from "../../../domain/ports/repositories/user.repository.js";
import { AuthTokenService } from "../../../domain/ports/services/auth-token.service.js";
import { PasswordHasher } from "../../../domain/ports/services/password-hasher.js";
import { TokenHasher } from "../../../domain/ports/services/token-hasher.js";
import { AuthSession, createAuthSession } from "./auth-session.js";

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: AuthTokenService,
    private readonly tokenHasher: TokenHasher,
  ) {}

  async execute(input: {
    email: string;
    password: string;
  }): Promise<AuthSession> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError();
    }

    const passwordMatches = await this.passwordHasher.match(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedError();
    }

    const tokens = this.tokenService.generate({
      userId: user.id,
      email: user.email,
    });
    const refreshTokenHash = this.tokenHasher.hash(tokens.refreshToken);
    await this.users.updateRefreshToken(user.id, refreshTokenHash);

    return createAuthSession(user, tokens);
  }
}
