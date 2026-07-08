import type { SchemaColumnType } from '@/features/schemas/types/schema-version';

export const schemaColumnTypes: Array<{ label: string; value: SchemaColumnType }> = [
  { label: 'Texte', value: 'string' },
  { label: 'Nombre entier', value: 'integer' },
  { label: 'Nombre decimal', value: 'decimal' },
  { label: 'Booleen', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Date et heure', value: 'datetime' },
];
