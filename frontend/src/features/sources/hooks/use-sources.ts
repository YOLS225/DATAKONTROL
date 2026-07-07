import { useApiQuery } from '@/shared/hooks/use-api-query';
import type { Source } from '@/features/sources/types/source';

export interface Options {
  initialPageSize?: number;
  initialPage?: number;
  initialSearchQuery?: string;
}

export const useSources = (options: Options = {}) => {
  const { initialPageSize = 5, initialPage = 1, initialSearchQuery = '' } = options;

  return useApiQuery<Source>({
    endpoint: '/source',
    queryKey: ['sources'],
    initialPage,
    initialPageSize,
    initialSearchQuery,
    isPaginated: true,
    additionalParams: {},
  });
};
