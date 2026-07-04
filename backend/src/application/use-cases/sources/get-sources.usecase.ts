import {
  PaginatedSources,
  SourceRepository,
} from "../../../domain/ports/repositories/source.repository.js";

export interface GetSourcesQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export class GetSourcesUsecase {
  constructor(private readonly sourceRepository: SourceRepository) {}

  execute(userId: string, query: GetSourcesQuery): Promise<PaginatedSources> {
    return this.sourceRepository.findAll({ userId, ...query });
  }
}
