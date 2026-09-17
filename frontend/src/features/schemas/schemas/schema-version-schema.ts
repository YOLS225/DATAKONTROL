import { z } from 'zod';

const optionalNumber = z.union([z.number(), z.string()]).optional();
const optionalString = z.string().optional();
const allowedValuesSchema = z.union([z.array(z.string()), z.string()]).optional();

const schemaColumnConstraintsSchema = z
  .object({
    minLength: optionalNumber,
    maxLength: optionalNumber,
    format: z.enum(['email', 'phone', 'url']).optional().or(z.literal('')),
    allowedValues: allowedValuesSchema,
    min: optionalNumber,
    max: optionalNumber,
    minDate: optionalString,
    maxDate: optionalString,
  })
  .superRefine((constraints, context) => {
    if (
      toOptionalNumber(constraints.minLength) !== undefined &&
      toOptionalNumber(constraints.maxLength) !== undefined &&
      toOptionalNumber(constraints.minLength)! > toOptionalNumber(constraints.maxLength)!
    ) {
      context.addIssue({
        code: 'custom',
        message: 'La longueur min ne peut pas depasser la longueur max',
        path: ['minLength'],
      });
    }

    if (
      toOptionalNumber(constraints.min) !== undefined &&
      toOptionalNumber(constraints.max) !== undefined &&
      toOptionalNumber(constraints.min)! > toOptionalNumber(constraints.max)!
    ) {
      context.addIssue({
        code: 'custom',
        message: 'La valeur min ne peut pas depasser la valeur max',
        path: ['min'],
      });
    }

    if (constraints.minDate && constraints.maxDate && new Date(constraints.minDate) > new Date(constraints.maxDate)) {
      context.addIssue({
        code: 'custom',
        message: 'La date min ne peut pas depasser la date max',
        path: ['minDate'],
      });
    }

    const allowedValues = normalizeAllowedValues(constraints.allowedValues);

    if (allowedValues.length > 100) {
      context.addIssue({
        code: 'custom',
        message: 'Maximum 100 valeurs autorisees',
        path: ['allowedValues'],
      });
    }

    if (allowedValues.length) {
      const uniqueValues = new Set(allowedValues);

      if (uniqueValues.size !== allowedValues.length) {
        context.addIssue({
          code: 'custom',
          message: 'Les valeurs autorisees ne peuvent pas etre dupliquees',
          path: ['allowedValues'],
        });
      }
    }
  });

export const schemaColumnSchema = z.object({
  id: z.string().trim().min(1, "L'identifiant est requis").max(80, "L'identifiant est trop long"),
  name: z.string().trim().min(1, 'Le nom est requis').max(80, 'Le nom est trop long'),
  type: z.enum(['string', 'integer', 'decimal', 'boolean', 'date', 'datetime']),
  required: z.boolean(),
  constraints: schemaColumnConstraintsSchema.optional(),
});

export const schemaVersionSchema = z.object({
  columns: z.array(schemaColumnSchema).min(1, 'Ajoute au moins une colonne').max(100, 'Maximum 100 colonnes'),
});

export type SchemaVersionFormData = z.infer<typeof schemaVersionSchema>;

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
