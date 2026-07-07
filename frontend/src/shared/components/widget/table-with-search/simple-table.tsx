import {
  DataTableWithSearch,
  type DataTableWithSearchProps,
} from '@/shared/components/widget/table-with-search/DataTable';

export function SimpleDataTable<TData, TValue>(props: DataTableWithSearchProps<TData, TValue>) {
  return <DataTableWithSearch {...props} onSearchChange={undefined} />;
}
