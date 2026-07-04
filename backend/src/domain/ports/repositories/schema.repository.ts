import type {
  SchemaDefinition,
  SchemaVersion,
} from "../../entities/schema.entity.js";

export const SCHEMA_VERSION_REPOSITORY = Symbol("SCHEMA_VERSION_REPOSITORY");

export interface ListSchemaVersionsQuery {
  sourceId: string;
  page: number;
  pageSize: number;
}

export interface PaginatedSchemaVersions {
  content: SchemaVersion[];
  total: number;
  page: number;
  page_size: number;
}

export interface SchemaVersionRepository {
  createDraft(schema: SchemaVersion): Promise<void>;
  findById(id: string): Promise<SchemaVersion | null>;
  findDraftBySourceId(sourceId: string): Promise<SchemaVersion | null>;
  findLatestVersionNumber(sourceId: string): Promise<number | null>;
  findAll(query: ListSchemaVersionsQuery): Promise<PaginatedSchemaVersions>;
  updateDefinition(id: string, definition: SchemaDefinition): Promise<boolean>;
  publish(
    sourceId: string,
    schemaVersionId: string,
    version: number,
    publishedAt: Date,
  ): Promise<boolean>;
}
