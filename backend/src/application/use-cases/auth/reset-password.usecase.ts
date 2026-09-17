import { UnauthorizedError } from "../../../common/exceptions/unauthorized.js";
import type { UserRepository } from "../../../domain/ports/repositories/user.repository.js";
import type { PasswordHasher } from "../../../domain/ports/services/password-hasher.js";
import type { TokenHasher } from "../../../domain/ports/services/token-hasher.js";

export class ResetPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenHasher: TokenHasher,
  ) {}

  async execute(input: {
    resetToken: string;
    password: string;
  }): Promise<void> {
    const resetTokenHash = this.tokenHasher.hash(input.resetToken);
    const user = await this.users.findByPasswordResetTokenHash(resetTokenHash);

    if (!user || !user.passwordResetTokenExpiresAt) {
      throw new UnauthorizedError();
    }

    if (user.passwordResetTokenExpiresAt.getTime() <= Date.now()) {
      await this.users.updatePasswordResetToken(user.id, null, null);
      throw new UnauthorizedError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    await this.users.updatePassword(user.id, passwordHash);
  }
}
