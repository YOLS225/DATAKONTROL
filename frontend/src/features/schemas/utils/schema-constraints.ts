import type { SchemaColumn, SchemaColumnConstraints } from '@/features/schemas/types/schema-version';
import type { SchemaVersionFormData } from '@/features/schemas/schemas/schema-version-schema';

export function sanitizeSchemaColumn(column: SchemaVersionFormData['columns'][number]): SchemaColumn {
  const constraints = sanitizeConstraints(column);

  return {
    id: column.id,
    name: column.name,
    type: column.type,
    required: column.required,
    ...(Object.keys(constraints).length ? { constraints } : {}),
  };
}

function sanitizeConstraints(column: SchemaVersionFormData['columns'][number]): SchemaColumnConstraints {
  const constraints = column.constraints ?? {};
  const allowedValues = normalizeAllowedValues(constraints.allowedValues);
  const withAllowedValues = allowedValues.length ? { allowedValues } : {};

  if (column.type === 'string') {
    return compactConstraints({
      minLength: toOptionalNumber(constraints.minLength),
      maxLength: toOptionalNumber(constraints.maxLength),
      format: constraints.format || undefined,
      ...withAllowedValues,
    });
  }

  if (column.type === 'integer' || column.type === 'decimal') {
    return compactConstraints({
      min: toOptionalNumber(constraints.min),
      max: toOptionalNumber(constraints.max),
      ...withAllowedValues,
    });
  }

  if (column.type === 'date' || column.type === 'datetime') {
    return compactConstraints({
      minDate: constraints.minDate,
      maxDate: constraints.maxDate,
      ...withAllowedValues,
    });
  }

  return compactConstraints(withAllowedValues);
}

function compactConstraints(constraints: SchemaColumnConstraints): SchemaColumnConstraints {
  return Object.fromEntries(
    Object.entries(constraints).filter(([, value]) => value !== undefined && value !== '')
  ) as SchemaColumnConstraints;
}

function toOptionalNumber(value: string | number | undefined) {
  if (value === '' || value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function normalizeAllowedValues(value: string[] | string | undefined) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}
