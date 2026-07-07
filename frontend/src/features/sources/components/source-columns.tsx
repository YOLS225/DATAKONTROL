import type { ColumnDef } from '@tanstack/react-table';
import { Database, Pencil } from 'lucide-react';
import type { Source } from '@/features/sources/types/source';

export const getSourceColumns = (onEdit: (source: Source) => void): ColumnDef<Source>[] => [
  {
    accessorKey: 'name',
    header: 'Nom',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
          <Database className="size-4" />
        </span>
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="line-clamp-2 text-muted-foreground">
        {row.original.description || 'Aucune description'}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Creation',
    cell: ({ row }) => {
      if (!row.original.createdAt) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <span className="text-muted-foreground">
          {new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).format(new Date(row.original.createdAt))}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <button
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        onClick={() => onEdit(row.original)}
        type="button"
      >
        <Pencil className="size-3.5" />
        Modifier
      </button>
    ),
  },
];
