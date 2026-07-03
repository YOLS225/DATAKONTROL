import { UserRepository } from "../../../domain/ports/repositories/user.repository.js";
import { User } from "../../../domain/entities/user.entity.js";
import { PasswordHasher } from "../../../domain/ports/services/password-hasher.js";
import { ConflictException } from "../../../common/exceptions/conflict.js";

export class RegisterUseCase {
  constructor(
    private readonly user: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<void> {
    const existingUser = await this.user.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const validUser = new User(
      crypto.randomUUID(),
      input.email,
      input.name,
      passwordHash,
    );
    await this.user.save(validUser);
  }
}
