import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import type { UploadErrorItem, UploadErrorType } from '@/features/reports/types/upload-error';
import { cn } from '@/shared/lib/utils';

const errorTypeLabels: Record<string, { label: string; className: string }> = {
  MISSING_COLUMN: {
    label: 'Colonne manquante',
    className: 'bg-destructive/10 text-destructive',
  },
  UNKNOWN_COLUMN: {
    label: 'Colonne inconnue',
    className: 'bg-muted text-muted-foreground',
  },
  REQUIRED: {
    label: 'Champ requis',
    className: 'bg-destructive/10 text-destructive',
  },
  INVALID_TYPE: {
    label: 'Type invalide',
    className: 'bg-primary/10 text-primary',
  },
  DUPLICATE_ROW: {
    label: 'Doublon',
    className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  },
};

export const uploadErrorColumns: ColumnDef<UploadErrorItem>[] = [
  {
    id: 'row',
    header: 'Ligne',
    cell: ({ row }) => <span className="font-medium">{getRowNumber(row.original)}</span>,
  },
  {
    id: 'column',
    header: 'Colonne',
    cell: ({ row }) => (
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
        {getColumnName(row.original)}
      </span>
    ),
  },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => <ErrorTypeBadge type={getErrorType(row.original)} />,
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => (
      <span className="line-clamp-2">
        {row.original.message || 'Erreur de validation'}
      </span>
    ),
  },
  {
    accessorKey: 'value',
    header: 'Valeur',
    cell: ({ row }) => {
      const value = row.original.value;

      if (value === undefined || value === null || value === '') {
        return <span className="text-muted-foreground">-</span>;
      }

      return <span className="font-mono text-xs">{String(value)}</span>;
    },
  },
];

function getRowNumber(error: UploadErrorItem) {
  return error.rowNumber ?? error.row ?? error.line ?? '-';
}

function getColumnName(error: UploadErrorItem) {
  return error.columnName ?? error.column ?? error.field ?? '-';
}

function getErrorType(error: UploadErrorItem): UploadErrorType {
  return error.type ?? error.errorType ?? error.code ?? 'Validation';
}

function ErrorTypeBadge({ type }: { type: UploadErrorType }) {
  const config = errorTypeLabels[type] ?? {
    label: type,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', config.className)}>
      <AlertTriangle className="size-3.5" />
      {config.label}
    </span>
  );
}
