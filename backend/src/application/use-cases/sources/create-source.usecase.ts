import { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import { UserRepository } from "../../../domain/ports/repositories/user.repository.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import { ConflictException } from "../../../common/exceptions/conflict.js";
import { Source } from "../../../domain/entities/source.entity.js";

export class CreateSourceUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sourceRepository: SourceRepository,
  ) {}

  async execute(
    userId: string,
    source: { name: string; description: string },
  ): Promise<void> {
    const userRecord = await this.userRepository.findById(userId);
    if (!userRecord) {
      throw new NotFoundError("User", userId);
    }

    const sourceRecord = await this.sourceRepository.findByName(
      userId,
      source.name,
    );
    if (sourceRecord) {
      throw new ConflictException("Source already exists");
    }

    const validSource = new Source(
      crypto.randomUUID(),
      source.name,
      source.description,
      userId,
    );
    await this.sourceRepository.save(validSource);
  }
}
