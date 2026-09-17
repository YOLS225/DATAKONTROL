import { User } from "../../entities/user.entity.js";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface UserRepository {
  save(user: User): Promise<void>;
  updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void>;
  updatePasswordResetToken(
    userId: string,
    tokenHash: string | null,
    expiresAt: Date | null,
  ): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  findByPasswordResetTokenHash(tokenHash: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
