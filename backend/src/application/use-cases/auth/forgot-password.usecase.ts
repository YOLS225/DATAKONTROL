import { randomBytes } from "node:crypto";
import type { ConfigService } from "@nestjs/config";
import type { UserRepository } from "../../../domain/ports/repositories/user.repository.js";
import type { TokenHasher } from "../../../domain/ports/services/token-hasher.js";

const RESET_TOKEN_BYTES = 32;
const DEFAULT_RESET_TOKEN_TTL_MINUTES = 15;

export interface ForgotPasswordResult {
  resetToken?: string;
}

export class ForgotPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly tokenHasher: TokenHasher,
    private readonly config: ConfigService,
  ) {}

  async execute(email: string): Promise<ForgotPasswordResult> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return {};
    }

    const resetToken = randomBytes(RESET_TOKEN_BYTES).toString("base64url");
    const resetTokenHash = this.tokenHasher.hash(resetToken);
    const expiresAt = this.getExpirationDate();

    await this.users.updatePasswordResetToken(
      user.id,
      resetTokenHash,
      expiresAt,
    );

    if (this.shouldExposeToken()) {
      return { resetToken };
    }

    return {};
  }

  private getExpirationDate(): Date {
    const ttlMinutes = Number(
      this.config.get<string>("PASSWORD_RESET_TOKEN_TTL_MINUTES") ??
        DEFAULT_RESET_TOKEN_TTL_MINUTES,
    );
    return new Date(Date.now() + ttlMinutes * 60 * 1000);
  }

  private shouldExposeToken(): boolean {
    const nodeEnv = this.config.get<string>("NODE_ENV");
    return nodeEnv !== "production";
  }
}
