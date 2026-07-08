import { z } from 'zod';

export const schemaColumnSchema = z.object({
  id: z.string().trim().min(1, "L'identifiant est requis").max(80, "L'identifiant est trop long"),
  name: z.string().trim().min(1, 'Le nom est requis').max(80, 'Le nom est trop long'),
  type: z.enum(['string', 'integer', 'decimal', 'boolean', 'date', 'datetime']),
  required: z.boolean(),
});

export const schemaVersionSchema = z.object({
  columns: z.array(schemaColumnSchema).min(1, 'Ajoute au moins une colonne'),
});

export type SchemaVersionFormData = z.infer<typeof schemaVersionSchema>;
