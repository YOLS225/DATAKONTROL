'use client';

import { AlertTriangle, Check, Database, FileText, RefreshCw, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { uploadErrorColumns } from '@/features/reports/components/upload-error-columns';
import { useUploadErrors } from '@/features/reports/hooks/use-upload-errors';
import { useSources } from '@/features/sources/hooks/use-sources';
import type { Source } from '@/features/sources/types/source';
import { useUploads } from '@/features/uploads/hooks/use-uploads';
import type { UploadItem } from '@/features/uploads/types/upload';
import { DataTableWithSearch } from '@/shared/components/widget/table-with-search/DataTable';
import { cn } from '@/shared/lib/utils';

export function ReportsPage() {
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedUploadId, setSelectedUploadId] = useState('');
  const sourcesQuery = useSources({ initialPageSize: 100 });
  const selectedSource = sourcesQuery.data?.data.find((source) => source.id === selectedSourceId);
  const uploadsQuery = useUploads({ sourceId: selectedSourceId, initialPageSize: 100 });
  const uploads = useMemo(() => uploadsQuery.data?.data ?? [], [uploadsQuery.data?.data]);
  const selectedUpload = uploads.find((upload) => upload.id === selectedUploadId);
  const {
    data,
    pagination,
    changePage,
    changePageSize,
    searchQuery,
    setSearchQuery,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useUploadErrors({ sourceId: selectedSourceId, uploadId: selectedUploadId });
  const errors = data?.data ?? [];
  const errorTotal = data?.pagination.total_elements ?? selectedUpload?.invalidRows ?? selectedUpload?.errorCount ?? errors.length;

  const completedUploads = useMemo(
    () => uploads.filter((upload) => upload.status === 'COMPLETED' || upload.status === 'FAILED'),
    [uploads]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Rapports</p>
            <h1 className="text-2xl font-semibold">Erreurs de validation</h1>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
            disabled={!selectedUploadId}
            onClick={() => refetch()}
            type="button"
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            Actualiser
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                <Database className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Source</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choisis la source du rapport.</p>
              </div>
            </div>
            <SourceCombobox
              isLoading={sourcesQuery.isLoading}
              onSelect={(sourceId) => {
                setSelectedSourceId(sourceId);
                setSelectedUploadId('');
              }}
              selectedSourceId={selectedSourceId}
              sources={sourcesQuery.data?.data ?? []}
            />
          </div>

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Upload</h2>
                <p className="mt-1 text-sm text-muted-foreground">Selectionne un fichier traite.</p>
              </div>
            </div>
            <UploadPicker
              isLoading={uploadsQuery.isLoading || uploadsQuery.isFetching}
              onSelect={setSelectedUploadId}
              selectedUploadId={selectedUploadId}
              uploads={completedUploads}
            />
          </div>
        </aside>

        <div className="space-y-5">
          <ReportSummary source={selectedSource} upload={selectedUpload} totalErrors={errorTotal} />

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Details des erreurs</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedUpload ? getUploadFilename(selectedUpload) : 'Selectionne un upload pour consulter les erreurs.'}
              </p>
            </div>

            {!selectedSourceId ? (
              <StateCard icon={FileText} title="Aucune source selectionnee" text="Les rapports apparaitront ici." />
            ) : !selectedUploadId ? (
              <StateCard icon={FileText} title="Aucun upload selectionne" text="Choisis un fichier traite." />
            ) : isError ? (
              <StateCard
                icon={AlertTriangle}
                title="Impossible de charger les erreurs"
                text={error instanceof Error ? error.message : 'Erreur inconnue'}
              />
            ) : (
              <DataTableWithSearch
                columns={uploadErrorColumns}
                currentPage={data?.pagination.currentPage ?? pagination.page}
                data={errors}
                emptyMessage="Aucune erreur de validation"
                initialSearchValue={searchQuery}
                isLoading={isLoading || isFetching}
                onPageChange={changePage}
                onPageSizeChange={changePageSize}
                onSearchChange={setSearchQuery}
                pageSize={data?.pagination.pageSize ?? pagination.pageSize}
                searchPlaceholder="Rechercher une erreur"
                totalItems={data?.pagination.total_elements ?? 0}
                totalPages={data?.pagination.total_pages ?? 1}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ReportSummary({
  source,
  upload,
  totalErrors,
}: {
  source?: Source;
  upload?: UploadItem;
  totalErrors: number;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard label="Source" value={source?.name ?? '-'} />
      <MetricCard label="Fichier" value={upload ? getUploadFilename(upload) : '-'} />
      <MetricCard label="Erreurs" value={String(totalErrors ?? 0)} tone={totalErrors > 0 ? 'danger' : 'default'} />
    </section>
  );
}

function MetricCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'danger' }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-2 truncate text-xl font-semibold', tone === 'danger' && 'text-destructive')}>{value}</p>
    </div>
  );
}

function SourceCombobox({
  sources,
  selectedSourceId,
  onSelect,
  isLoading,
}: {
  sources: Source[];
  selectedSourceId: string;
  onSelect: (sourceId: string) => void;
  isLoading?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectedSource = sources.find((source) => source.id === selectedSourceId);
  const filteredSources = sources.filter((source) => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return source.name.toLowerCase().includes(search) || (source.description ?? '').toLowerCase().includes(search);
  });

  return (
    <div className="mt-5 space-y-2">
      <SearchInput
        disabled={isLoading}
        onChange={(value) => {
          setQuery(value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Rechercher une source"
        value={query}
      />

      {isOpen && (
        <PickerList
          emptyLabel="Aucune source trouvee"
          isLoading={isLoading}
          loadingLabel="Chargement des sources..."
        >
          {filteredSources.map((source) => {
            const isSelected = source.id === selectedSourceId;

            return (
              <PickerButton
                description={source.description}
                isSelected={isSelected}
                key={source.id}
                label={source.name}
                onClick={() => {
                  onSelect(source.id);
                  setQuery('');
                  setIsOpen(false);
                }}
              />
            );
          })}
        </PickerList>
      )}

      <SelectedLabel label={selectedSource ? `Source selectionnee : ${selectedSource.name}` : 'Aucune source selectionnee.'} />
    </div>
  );
}

function UploadPicker({
  uploads,
  selectedUploadId,
  onSelect,
  isLoading,
}: {
  uploads: UploadItem[];
  selectedUploadId: string;
  onSelect: (uploadId: string) => void;
  isLoading?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectedUpload = uploads.find((upload) => upload.id === selectedUploadId);
  const filteredUploads = uploads.filter((upload) => getUploadFilename(upload).toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mt-5 space-y-2">
      <SearchInput
        disabled={isLoading}
        onChange={(value) => {
          setQuery(value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Rechercher un upload"
        value={query}
      />

      {isOpen && (
        <PickerList
          emptyLabel="Aucun upload traite"
          isLoading={isLoading}
          loadingLabel="Chargement des uploads..."
        >
          {filteredUploads.map((upload) => {
            const isSelected = upload.id === selectedUploadId;
            const invalidRows = upload.invalidRows ?? upload.errorCount ?? 0;

            return (
              <PickerButton
                description={`${upload.status ?? 'UNKNOWN'} - ${invalidRows} erreur${invalidRows > 1 ? 's' : ''}`}
                isSelected={isSelected}
                key={upload.id}
                label={getUploadFilename(upload)}
                onClick={() => {
                  onSelect(upload.id);
                  setQuery('');
                  setIsOpen(false);
                }}
              />
            );
          })}
        </PickerList>
      )}

      <SelectedLabel label={selectedUpload ? `Upload selectionne : ${getUploadFilename(selectedUpload)}` : 'Aucun upload selectionne.'} />
    </div>
  );
}

function SearchInput({
  value,
  placeholder,
  disabled,
  onChange,
  onFocus,
}: {
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        className="h-10 w-full rounded-md border bg-input pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function PickerList({
  children,
  isLoading,
  loadingLabel,
  emptyLabel,
}: {
  children: ReactNode;
  isLoading?: boolean;
  loadingLabel: string;
  emptyLabel: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="max-h-64 overflow-y-auto rounded-md border bg-background p-1">
      {isLoading ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">{loadingLabel}</p>
      ) : hasChildren ? (
        children
      ) : (
        <p className="px-3 py-2 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function PickerButton({
  label,
  description,
  isSelected,
  onClick,
}: {
  label: string;
  description?: string | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm hover:bg-muted',
        isSelected && 'bg-primary/10 text-primary'
      )}
      onClick={onClick}
      type="button"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{label}</span>
        {description && <span className="block truncate text-xs text-muted-foreground">{description}</span>}
      </span>
      {isSelected && <Check className="size-4 shrink-0" />}
    </button>
  );
}

function SelectedLabel({ label }: { label: string }) {
  return <p className="text-xs text-muted-foreground">{label}</p>;
}

function StateCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof FileText;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/25 p-8 text-center">
      <Icon className="mx-auto size-9 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function getUploadFilename(upload: UploadItem) {
  return upload.originalName ?? upload.originalFilename ?? upload.fileName ?? upload.filename ?? 'Fichier recu';
}
