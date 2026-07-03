import { UnauthorizedError } from "../../../common/exceptions/unauthorized.js";
import { UserRepository } from "../../../domain/ports/repositories/user.repository.js";
import { AuthTokenService } from "../../../domain/ports/services/auth-token.service.js";
import { TokenHasher } from "../../../domain/ports/services/token-hasher.js";

export class LogoutUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly tokenService: AuthTokenService,
    private readonly tokenHasher: TokenHasher,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await this.users.findById(payload.userId);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const tokenMatches = this.tokenHasher.match(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!tokenMatches) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    await this.users.updateRefreshToken(user.id, null);
  }
}
