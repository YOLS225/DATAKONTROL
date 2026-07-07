import { useApiQuery } from '@/shared/hooks/use-api-query';
import type { SchemaVersion } from '@/features/schemas/types/schema-version';

export interface Options {
  sourceId?: string;
  initialPageSize?: number;
  initialPage?: number;
}

export const useSchemaVersions = (options: Options = {}) => {
  const { sourceId, initialPageSize = 5, initialPage = 1 } = options;

  return useApiQuery<SchemaVersion>({
    endpoint: sourceId ? `/source/${sourceId}/schema-versions` : '/source/__missing__/schema-versions',
    queryKey: ['schema-versions', sourceId],
    initialPage,
    initialPageSize,
    isPaginated: true,
    queryOptions: {
      enabled: Boolean(sourceId),
    },
  });
};
