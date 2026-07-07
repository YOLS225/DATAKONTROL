import { z } from 'zod';

export const sourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom est requis')
    .max(80, 'Le nom est trop long'),
  description: z
    .string()
    .trim()
    .max(255, 'La description est trop longue')
    .optional(),
});

export type SourceFormData = z.infer<typeof sourceSchema>;
