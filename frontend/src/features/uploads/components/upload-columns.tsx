import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Clock3, ExternalLink, FileSpreadsheet, Loader2, XCircle } from 'lucide-react';
import type { UploadItem } from '@/features/uploads/types/upload';
import { cn } from '@/shared/lib/utils';

export const getUploadColumns = (onViewFile: (upload: UploadItem) => void, isViewingFile?: boolean): ColumnDef<UploadItem>[] => [
  {
    id: 'file',
    header: 'Fichier',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
          <FileSpreadsheet className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{getUploadFilename(row.original)}</p>
          <p className="text-xs text-muted-foreground">{row.original.id.slice(0, 8)}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => <UploadStatusBadge status={row.original.status ?? 'PENDING'} />,
  },
  {
    id: 'rows',
    header: 'Lignes',
    cell: ({ row }) => {
      const upload = row.original;

      if (upload.totalRows === undefined && upload.validRows === undefined && upload.invalidRows === undefined) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <div className="text-sm">
          <p>{upload.totalRows ?? 0} total</p>
          <p className="text-xs text-muted-foreground">
            {upload.validRows ?? 0} valides / {upload.invalidRows ?? upload.errorCount ?? 0} invalides
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Reception',
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
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(row.original.createdAt))}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <button
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          disabled={isViewingFile}
          onClick={() => onViewFile(row.original)}
          type="button"
        >
          <ExternalLink className="size-3.5" />
          Voir fichier
        </button>
      </div>
    ),
  },
];

function UploadStatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', config.className)}>
      <Icon className={cn('size-3', config.spin && 'animate-spin')} />
      {config.label}
    </span>
  );
}

function getStatusConfig(status: string) {
  if (status === 'COMPLETED') {
    return {
      label: 'Termine',
      icon: CheckCircle2,
      className: 'bg-primary/10 text-primary',
      spin: false,
    };
  }

  if (status === 'FAILED') {
    return {
      label: 'Echoue',
      icon: XCircle,
      className: 'bg-destructive/10 text-destructive',
      spin: false,
    };
  }

  if (status === 'PROCESSING') {
    return {
      label: 'Traitement',
      icon: Loader2,
      className: 'bg-muted text-muted-foreground',
      spin: true,
    };
  }

  return {
    label: 'En attente',
    icon: Clock3,
    className: 'bg-muted text-muted-foreground',
    spin: false,
  };
}

function getUploadFilename(upload: UploadItem) {
  return upload.originalName ?? upload.originalFilename ?? upload.fileName ?? upload.filename ?? 'Fichier recu';
}
