import { ConflictException } from "../../../common/exceptions/conflict.js";
import type { SchemaDefinition } from "../../../domain/entities/schema.entity.js";

export function validateSchemaDefinition(
  definition: SchemaDefinition,
  requireColumn = false,
): void {
  if (requireColumn && definition.columns.length === 0) {
    throw new ConflictException(
      "A schema must contain at least one column before publication",
    );
  }

  const ids = new Set<string>();
  const names = new Set<string>();
  for (const column of definition.columns) {
    const id = column.id.trim().toLowerCase();
    const name = column.name.trim().toLowerCase();
    if (!id || !name) {
      throw new ConflictException("Schema column identifiers cannot be empty");
    }
    if (ids.has(id)) {
      throw new ConflictException(`Duplicate schema column id: ${column.id}`);
    }
    if (names.has(name)) {
      throw new ConflictException(
        `Duplicate schema column name: ${column.name}`,
      );
    }
    ids.add(id);
    names.add(name);
  }
}
