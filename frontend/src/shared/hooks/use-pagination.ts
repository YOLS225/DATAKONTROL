import { useCallback, useState } from 'react';

export interface PaginationState {
    page: number;
    pageSize: number;
}

export interface UsePaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
    const { initialPage = 1, initialPageSize = 5 } = options;

    const [pagination, setPagination] = useState<PaginationState>({
        page: initialPage,
        pageSize: initialPageSize,
    });

    const changePage = useCallback((newPage: number) => {
        setPagination((prev) => ({
            ...prev,
            page: newPage,
        }));
    }, []);

    const changePageSize = useCallback((newPageSize: number) => {
        setPagination({
            pageSize: newPageSize,
            page: 1,
        });
    }, []);

    return {
        pagination,
        changePage,
        changePageSize,
        setPagination,
    };
}
