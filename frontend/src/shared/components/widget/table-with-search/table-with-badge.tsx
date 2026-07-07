import type { ReactNode } from 'react';
import {
  DataTableWithSearch,
  type DataTableWithSearchProps,
} from '@/shared/components/widget/table-with-search/DataTable';

interface TableWithBadgeProps<TData, TValue> extends DataTableWithSearchProps<TData, TValue> {
  title?: string;
  badgeCount?: number;
  badgeText?: string;
  actionButtons?: ReactNode;
}

export function TableWithBadge<TData, TValue>({
  title = 'Liste',
  badgeCount,
  badgeText = 'elements',
  actionButtons,
  ...tableProps
}: TableWithBadgeProps<TData, TValue>) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
          {badgeCount !== undefined && (
            <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {badgeCount} {badgeText}
            </span>
          )}
        </div>
        {actionButtons}
      </div>
      <DataTableWithSearch {...tableProps} />
    </div>
  );
}
