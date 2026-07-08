import { Source } from "../../entities/source.entity.js";
export const SOURCE_REPOSITORY = Symbol("SOURCE_REPOSITORY");

export type UpdateSourceData = Partial<Pick<Source, "name" | "description">>;

export interface ListSourcesQuery {
  userId: string;
  page: number;
  pageSize: number;
  search?: string;
}

export interface SourceListItem {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface PaginatedSources {
  content: SourceListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface SourceRepository {
  save(source: Source): Promise<void>;
  findById(id: string): Promise<Source | null>;
  findByName(userId: string, name: string): Promise<Source | null>;
  findAll(query: ListSourcesQuery): Promise<PaginatedSources>;
  update(id: string, source: UpdateSourceData): Promise<void>;
  countLinks(id: string): Promise<number>;
  delete(id: string): Promise<void>;
}
