import {
  SourceRepository,
  UpdateSourceData,
} from "../../../domain/ports/repositories/source.repository.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import { ConflictException } from "../../../common/exceptions/conflict.js";

export class UpdateSourcesUsecase {
  constructor(private readonly sourceRepository: SourceRepository) {}

  async execute(
    userId: string,
    id: string,
    source: UpdateSourceData,
  ): Promise<void> {
    const record = await this.sourceRepository.findById(id);
    if (!record || record.userId !== userId) {
      throw new NotFoundError("Source", id);
    }

    if (source.name !== undefined && source.name !== record.name) {
      const duplicate = await this.sourceRepository.findByName(
        userId,
        source.name,
      );
      if (duplicate) {
        throw new ConflictException("Source already exists");
      }
    }

    await this.sourceRepository.update(id, source);
  }
}
