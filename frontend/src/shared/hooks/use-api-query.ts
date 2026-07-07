import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { axiosInstance } from '@/shared/api/axios-instance';
import { usePagination, type UsePaginationOptions } from '@/shared/hooks/use-pagination';

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    total_elements: number;
    total_pages: number;
    currentPage: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

type BackendPaginatedResponse<T> = {
  data?:
    | T[]
    | {
        content?: T[];
        data?: T[];
        items?: T[];
        results?: T[];
        total?: number;
        total_elements?: number;
        total_pages?: number;
        page?: number;
        page_size?: number;
        size?: number;
      };
  content?: T[];
  items?: T[];
  results?: T[];
  total?: number;
  total_elements?: number;
  total_pages?: number;
  page?: number;
  page_size?: number;
  size?: number;
};

export interface UseApiQueryOptions<T> extends UsePaginationOptions {
  endpoint: string;
  queryKey: string | readonly unknown[];
  initialSearchQuery?: string;
  searchParam?: string;
  additionalParams?: Record<string, string | number | boolean | undefined>;
  queryOptions?: Omit<UseQueryOptions<PaginatedData<T>, Error>, 'queryKey' | 'queryFn'>;
  isPaginated?: boolean;
}

const unwrapData = <T,>(payload: BackendPaginatedResponse<T>): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.data && !Array.isArray(payload.data)) {
    return (
      payload.data.content ??
      payload.data.data ??
      payload.data.items ??
      payload.data.results ??
      []
    );
  }

  return payload.content ?? payload.items ?? payload.results ?? [];
};

const unwrapPagination = <T,>(
  payload: BackendPaginatedResponse<T>,
  fallbackPage: number,
  fallbackPageSize: number
) => {
  const nested = !Array.isArray(payload.data) && payload.data ? payload.data : undefined;
  const totalElements = nested?.total ?? nested?.total_elements ?? payload.total ?? payload.total_elements ?? 0;
  const pageSize = nested?.page_size ?? nested?.size ?? payload.page_size ?? payload.size ?? fallbackPageSize;
  const totalPages =
    nested?.total_pages ??
    payload.total_pages ??
    Math.max(1, Math.ceil(totalElements / Math.max(1, pageSize)));
  const currentPage = nested?.page ?? payload.page ?? fallbackPage;

  return {
    total_elements: totalElements,
    total_pages: totalPages,
    currentPage,
    pageSize,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  };
};

export function useApiQuery<T>({
  endpoint,
  queryKey,
  initialPage = 1,
  initialPageSize = 5,
  initialSearchQuery = '',
  searchParam = 'search',
  additionalParams = {},
  queryOptions = {},
  isPaginated = true,
}: UseApiQueryOptions<T>) {
  const { pagination, changePage, changePageSize } = usePagination({
    initialPage,
    initialPageSize,
  });
  const [searchQuery, setSearchQueryState] = useState(initialSearchQuery);

  const paramsKey = JSON.stringify(additionalParams);
  const stableAdditionalParams = useMemo(
    () => JSON.parse(paramsKey) as Record<string, string | number | boolean | undefined>,
    [paramsKey]
  );

  const setSearchQuery = useCallback((query: string) => {
    const normalizedQuery = query.trim();

    setSearchQueryState((currentQuery) => {
      if (currentQuery === normalizedQuery) {
        return currentQuery;
      }

      changePage(1);
      return normalizedQuery;
    });
  }, [changePage]);

  const normalizedQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  const queryResult = useQuery<PaginatedData<T>, Error>({
    queryKey: [
      ...normalizedQueryKey,
      isPaginated ? pagination.page : null,
      isPaginated ? pagination.pageSize : null,
      searchQuery,
      stableAdditionalParams,
    ],
    queryFn: async ({ signal }) => {
      const params: Record<string, string | number | boolean> = {};

      if (isPaginated) {
        params.page = pagination.page;
        params.page_size = pagination.pageSize;
      }

      if (searchQuery) {
        params[searchParam] = searchQuery;
      }

      Object.entries(stableAdditionalParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params[key] = value;
        }
      });

      const response = await axiosInstance.get<BackendPaginatedResponse<T>>(endpoint, {
        params,
        signal,
      });

      const data = unwrapData(response.data);
      const paginationResult = isPaginated
        ? unwrapPagination(response.data, pagination.page, pagination.pageSize)
        : {
            total_elements: data.length,
            total_pages: 1,
            currentPage: 1,
            pageSize: data.length,
            hasNext: false,
            hasPrevious: false,
          };

      return {
        data,
        pagination: paginationResult,
      };
    },
    ...queryOptions,
  });

  return {
    ...queryResult,
    pagination,
    changePage,
    changePageSize,
    searchQuery,
    setSearchQuery,
  };
}
