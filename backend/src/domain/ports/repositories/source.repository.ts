import { Source } from "../../entities/source.entity.js";

export const SOURCE_REPOSITORY = Symbol("SOURCE_REPOSITORY");

export interface SourceRepository {
  save(source: Source): Promise<void>;
  findById(id: string): Promise<Source | null>;
  findByName(userId: string, name: string): Promise<Source | null>;
  findAll(): Promise<Source[]>;
  update(id: string, source: Source): Promise<void>;
  delete(id: string): Promise<void>;
}
