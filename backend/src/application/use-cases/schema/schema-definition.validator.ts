import { ConflictException } from "../../../common/exceptions/conflict.js";
import type {
  SchemaColumn,
  SchemaDefinition,
} from "../../../domain/entities/schema.entity.js";

const MAX_COLUMNS = 100;
const MAX_ALLOWED_VALUES = 100;

export function validateSchemaDefinition(
  definition: SchemaDefinition,
  requireColumn = false,
): void {
  if (definition.columns.length > MAX_COLUMNS) {
    throw new ConflictException(
      `A schema cannot contain more than ${MAX_COLUMNS} columns`,
    );
  }

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
    validateColumnConstraints(column);
  }
}

function validateColumnConstraints(column: SchemaColumn): void {
  const constraints = column.constraints;
  if (!constraints) return;

  if (
    (constraints.minLength !== undefined ||
      constraints.maxLength !== undefined ||
      constraints.format !== undefined) &&
    column.type !== "string"
  ) {
    throw new ConflictException(
      `Text constraints are only supported for string column "${column.name}"`,
    );
  }

  if (
    (constraints.min !== undefined || constraints.max !== undefined) &&
    column.type !== "integer" &&
    column.type !== "decimal"
  ) {
    throw new ConflictException(
      `Numeric constraints are only supported for numeric column "${column.name}"`,
    );
  }

  if (
    (constraints.minDate !== undefined || constraints.maxDate !== undefined) &&
    column.type !== "date" &&
    column.type !== "datetime"
  ) {
    throw new ConflictException(
      `Date constraints are only supported for date column "${column.name}"`,
    );
  }

  if (
    constraints.minLength !== undefined &&
    constraints.maxLength !== undefined &&
    constraints.minLength > constraints.maxLength
  ) {
    throw new ConflictException(
      `Minimum length cannot be greater than maximum length for column "${column.name}"`,
    );
  }

  if (
    constraints.min !== undefined &&
    constraints.max !== undefined &&
    constraints.min > constraints.max
  ) {
    throw new ConflictException(
      `Minimum value cannot be greater than maximum value for column "${column.name}"`,
    );
  }

  validateAllowedValues(column);
  validateDateBounds(column);
}

function validateAllowedValues(column: SchemaColumn): void {
  const allowedValues = column.constraints?.allowedValues;
  if (!allowedValues) return;

  if (allowedValues.length > MAX_ALLOWED_VALUES) {
    throw new ConflictException(
      `Column "${column.name}" cannot contain more than ${MAX_ALLOWED_VALUES} allowed values`,
    );
  }

  const values = new Set<string>();
  for (const value of allowedValues) {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      throw new ConflictException(
        `Allowed values cannot be empty for column "${column.name}"`,
      );
    }
    if (values.has(normalizedValue.toLowerCase())) {
      throw new ConflictException(
        `Duplicate allowed value "${value}" for column "${column.name}"`,
      );
    }
    values.add(normalizedValue.toLowerCase());
  }
}

function validateDateBounds(column: SchemaColumn): void {
  const constraints = column.constraints;
  if (!constraints) return;

  const minDate = constraints.minDate
    ? parseDateConstraint(column, constraints.minDate, "minimum")
    : null;
  const maxDate = constraints.maxDate
    ? parseDateConstraint(column, constraints.maxDate, "maximum")
    : null;

  if (minDate && maxDate && minDate.getTime() > maxDate.getTime()) {
    throw new ConflictException(
      `Minimum date cannot be greater than maximum date for column "${column.name}"`,
    );
  }
}

function parseDateConstraint(
  column: SchemaColumn,
  value: string,
  label: "minimum" | "maximum",
): Date {
  const isValid =
    column.type === "date"
      ? /^\d{4}-\d{2}-\d{2}$/.test(value)
      : !Number.isNaN(Date.parse(value));

  if (!isValid) {
    throw new ConflictException(
      `Invalid ${label} date constraint for column "${column.name}"`,
    );
  }

  return new Date(column.type === "date" ? `${value}T00:00:00.000Z` : value);
}
