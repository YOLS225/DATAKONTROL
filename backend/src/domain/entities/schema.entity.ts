export type ColumnType =
  "string" | "integer" | "decimal" | "boolean" | "date" | "datetime";

export type ColumnFormat = "email" | "phone" | "url";

export interface SchemaColumnConstraints {
  minLength?: number;
  maxLength?: number;
  format?: ColumnFormat;
  allowedValues?: string[];
  min?: number;
  max?: number;
  minDate?: string;
  maxDate?: string;
}

export interface SchemaColumn {
  id: string;
  name: string;
  type: ColumnType;
  required: boolean;
  constraints?: SchemaColumnConstraints;
}

export interface SchemaDefinition {
  columns: SchemaColumn[];
}

export class SchemaVersion {
  constructor(
    public readonly id: string,
    public readonly sourceId: string,
    public readonly version: number,
    public readonly schemaDefinition: SchemaDefinition,
    public readonly createdBy: string,
    public readonly isActive = false,
    public readonly createdAt = new Date(),
    public readonly publishedAt: Date | null = null,
  ) {}
}
