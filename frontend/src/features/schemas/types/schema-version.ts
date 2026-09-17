export type SchemaColumnType = 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime';

export type SchemaColumnConstraints = {
  minLength?: number;
  maxLength?: number;
  format?: 'email' | 'phone' | 'url';
  allowedValues?: string[];
  min?: number;
  max?: number;
  minDate?: string;
  maxDate?: string;
};

export type SchemaColumn = {
  id: string;
  name: string;
  type: SchemaColumnType;
  required: boolean;
  constraints?: SchemaColumnConstraints;
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
