export type ColumnType =
  "string" | "integer" | "decimal" | "boolean" | "date" | "datetime";

export interface SchemaColumn {
  id: string;
  name: string;
  type: ColumnType;
  required: boolean;
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
