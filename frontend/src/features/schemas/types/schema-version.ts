export type SchemaColumnType = 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime';

export type SchemaColumn = {
  id: string;
  name: string;
  type: SchemaColumnType;
  required: boolean;
};

export type SchemaDefinition = {
  columns: SchemaColumn[];
};

export type SchemaVersion = {
  id: string;
  sourceId?: string;
  schemaDefinition?: SchemaDefinition;
  status?: 'DRAFT' | 'PUBLISHED' | string;
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

export type UpsertSchemaVersionPayload = {
  schemaDefinition?: SchemaDefinition;
};

export type SchemaVersionListResponse =
  | SchemaVersion[]
  | {
      data?:
        | SchemaVersion[]
        | {
            content?: SchemaVersion[];
            total?: number;
            page?: number;
            page_size?: number;
          };
      content?: SchemaVersion[];
      success?: boolean;
      message?: string;
    };
