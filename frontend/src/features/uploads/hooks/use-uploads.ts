import { useApiQuery } from '@/shared/hooks/use-api-query';
import type { UploadItem } from '@/features/uploads/types/upload';

export interface Options {
  sourceId?: string;
  initialPageSize?: number;
  initialPage?: number;
  initialSearchQuery?: string;
}

export const useUploads = (options: Options = {}) => {
  const { sourceId, initialPageSize = 5, initialPage = 1, initialSearchQuery = '' } = options;

  return useApiQuery<UploadItem>({
    endpoint: sourceId ? `/source/${sourceId}/uploads` : '/source/__missing__/uploads',
    queryKey: ['uploads', sourceId],
    initialPage,
    initialPageSize,
    initialSearchQuery,
    isPaginated: true,
    queryOptions: {
      enabled: Boolean(sourceId),
      refetchInterval: (query) => {
        const uploads = query.state.data?.data ?? [];
        const hasRunningUpload = uploads.some((upload) => upload.status === 'PENDING' || upload.status === 'PROCESSING');

        return hasRunningUpload ? 3000 : false;
      },
    },
  });
};
