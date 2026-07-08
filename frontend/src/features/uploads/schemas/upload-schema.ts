import { z } from 'zod';

const isUploadFile = (value: unknown) => typeof File !== 'undefined' && value instanceof File;

export const uploadSchema = z.object({
  file: z
    .custom<File>(isUploadFile, 'Selectionne un fichier CSV, XLS ou XLSX')
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Le fichier ne doit pas depasser 10 MB')
    .refine((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase();

      return extension ? ['csv', 'xls', 'xlsx'].includes(extension) : false;
    }, 'Format accepte : CSV, XLS ou XLSX'),
});

export type UploadFormData = z.infer<typeof uploadSchema>;
