import { ConflictException } from "../../../common/exceptions/conflict.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";

export class DeleteSourceUseCase {
  constructor(private readonly sourceRepository: SourceRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    const source = await this.sourceRepository.findById(id);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", id);
    }

    const links = await this.sourceRepository.countLinks(id);
    if (links > 0) {
      throw new ConflictException("Source is linked and cannot be deleted");
    }

    await this.sourceRepository.delete(id);
  }
}
