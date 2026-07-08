import { useApiQuery } from '@/shared/hooks/use-api-query';
import type { UploadErrorItem } from '@/features/reports/types/upload-error';

export interface Options {
  sourceId?: string;
  uploadId?: string;
  initialPageSize?: number;
  initialPage?: number;
  initialSearchQuery?: string;
}

export const useUploadErrors = (options: Options = {}) => {
  const { sourceId, uploadId, initialPageSize = 10, initialPage = 1, initialSearchQuery = '' } = options;
  const endpoint =
    sourceId && uploadId
      ? `/source/${sourceId}/uploads/${uploadId}/errors`
      : '/source/__missing__/uploads/__missing__/errors';

  return useApiQuery<UploadErrorItem>({
    endpoint,
    queryKey: ['upload-errors', sourceId, uploadId],
    initialPage,
    initialPageSize,
    initialSearchQuery,
    isPaginated: true,
    queryOptions: {
      enabled: Boolean(sourceId && uploadId),
    },
  });
};
