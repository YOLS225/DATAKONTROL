import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";

export interface GetSourceResult {
  id: string;
  name: string;
  description: string;
  currentSchemaVer: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GetSourceUseCase {
  constructor(private readonly sourceRepository: SourceRepository) {}

  async execute(userId: string, id: string): Promise<GetSourceResult> {
    const source = await this.sourceRepository.findById(id);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", id);
    }

    return {
      id: source.id,
      name: source.name,
      description: source.description,
      currentSchemaVer: source.currentSchemaVer,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }
}
