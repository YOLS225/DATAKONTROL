'use client';

import * as React from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface DataTableWithSearchProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearchChange?: (search: string) => void;
  pageSize?: number;
  isLoading?: boolean;
  filterButton?: React.ReactNode;
  exportXlsx?: () => void | Promise<void>;
  searchPlaceholder?: string;
  initialSearchValue?: string;
  emptyMessage?: string;
  searchDebounceMs?: number;
}

const pageSizeOptions = [5, 10, 20, 50];

export function DataTableWithSearch<TData, TValue>({
  columns,
  data,
  totalItems = 0,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  pageSize = 5,
  isLoading = false,
  filterButton,
  exportXlsx,
  searchPlaceholder = 'Rechercher',
  initialSearchValue = '',
  emptyMessage = 'Pas de donnees',
  searchDebounceMs = 800,
}: DataTableWithSearchProps<TData, TValue>) {
  const [searchValue, setSearchValue] = React.useState(initialSearchValue);
  const [isExporting, setIsExporting] = React.useState(false);
  const lastEmittedSearchRef = React.useRef(initialSearchValue.trim());

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalizedSearch = searchValue.trim();

      if (normalizedSearch === lastEmittedSearchRef.current) {
        return;
      }

      lastEmittedSearchRef.current = normalizedSearch;
      onSearchChange?.(normalizedSearch);
    }, searchDebounceMs);

    return () => window.clearTimeout(timer);
  }, [onSearchChange, searchDebounceMs, searchValue]);

  const handleExport = async () => {
    if (!exportXlsx) {
      return;
    }

    try {
      setIsExporting(true);
      await Promise.resolve(exportXlsx());
    } finally {
      setIsExporting(false);
    }
  };

  const visiblePageCount = Math.max(1, totalPages);
  const pageButtons = Array.from({ length: Math.min(visiblePageCount, 5) }, (_, index) => {
    if (visiblePageCount <= 5) {
      return index + 1;
    }

    if (currentPage <= 3) {
      return index + 1;
    }

    if (currentPage >= visiblePageCount - 2) {
      return visiblePageCount - 4 + index;
    }

    return currentPage - 2 + index;
  });

  return (
    <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border bg-input pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={searchValue}
          />
        </div>

        <div className="flex items-center gap-2">
          {filterButton}
          {exportXlsx && (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
              disabled={isExporting}
              onClick={handleExport}
              type="button"
            >
              {isExporting && <Loader2 className="size-4 animate-spin" />}
              Exporter
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="h-11 whitespace-nowrap px-4 text-left text-xs font-semibold uppercase text-muted-foreground"
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="h-28 px-4 text-center text-muted-foreground" colSpan={columns.length}>
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Chargement en cours...
                  </span>
                </td>
              </tr>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr className="border-t transition hover:bg-muted/35" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td className="px-4 py-3 align-middle" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="h-28 px-4 text-center text-muted-foreground" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Afficher</span>
          <select
            className="h-9 rounded-md border bg-input px-2 text-sm outline-none"
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>par page</span>
        </div>

        <p className="text-sm text-muted-foreground">
          {totalItems > 0 ? `${totalItems} resultats` : '0 resultat'}
        </p>

        <div className="flex items-center gap-1">
          <PaginationButton
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            <ChevronLeft className="size-4" />
          </PaginationButton>
          {pageButtons.map((page) => (
            <PaginationButton
              active={page === currentPage}
              disabled={isLoading}
              key={page}
              onClick={() => onPageChange?.(page)}
            >
              {page}
            </PaginationButton>
          ))}
          <PaginationButton
            disabled={currentPage >= visiblePageCount || isLoading}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            <ChevronRight className="size-4" />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
}

function PaginationButton({
  active = false,
  children,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'grid size-9 place-items-center rounded-md border text-sm transition disabled:pointer-events-none disabled:opacity-50',
        active ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
