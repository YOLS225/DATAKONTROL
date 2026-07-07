import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Eye, Rocket } from 'lucide-react';
import type { SchemaVersion } from '@/features/schemas/types/schema-version';

export const getSchemaVersionColumns = (
  onView: (version: SchemaVersion) => void,
  onPublish: (version: SchemaVersion) => void,
  isPublishing?: boolean
): ColumnDef<SchemaVersion>[] => [
  {
    accessorKey: 'version',
    header: 'Version',
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.version ? `v${row.original.version}` : row.original.id.slice(0, 8)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status ?? 'DRAFT';
      const isActive = row.original.isActive === true;
      const isPublished = status === 'PUBLISHED' || Boolean(row.original.publishedAt);

      return (
        <span
          className={
            isActive
              ? 'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary'
              : 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
          }
        >
          {isActive && <CheckCircle2 className="size-3" />}
          {isActive ? 'Actif' : isPublished ? 'Publie' : 'Brouillon'}
        </span>
      );
    },
  },
  {
    id: 'columns',
    header: 'Colonnes',
    cell: ({ row }) => <span>{row.original.schemaDefinition?.columns?.length ?? 0}</span>,
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
    cell: ({ row }) => {
      const status = row.original.status ?? 'DRAFT';
      const isActive = row.original.isActive === true;
      const isPublished = status === 'PUBLISHED' || Boolean(row.original.publishedAt);

      return (
        <div className="flex justify-end gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            onClick={() => onView(row.original)}
            type="button"
          >
            <Eye className="size-3.5" />
            Voir / modifier
          </button>
          {!isActive && !isPublished && (
            <button
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
              disabled={isPublishing}
              onClick={() => onPublish(row.original)}
              type="button"
            >
              <Rocket className="size-3.5" />
              Publier
            </button>
          )}
        </div>
      );
    },
  },
];
