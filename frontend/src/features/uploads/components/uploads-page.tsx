'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Database, FileUp, Loader2, RefreshCw, Search, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { uploadService } from '@/features/uploads/api/upload-service';
import { getUploadColumns } from '@/features/uploads/components/upload-columns';
import { useUploads } from '@/features/uploads/hooks/use-uploads';
import { uploadSchema, type UploadFormData } from '@/features/uploads/schemas/upload-schema';
import { useUploadWatchStore } from '@/features/uploads/stores/upload-watch-store';
import type { UploadItem } from '@/features/uploads/types/upload';
import { getUploadFilename, unwrapUpload } from '@/features/uploads/utils/upload-utils';
import { useSources } from '@/features/sources/hooks/use-sources';
import type { Source } from '@/features/sources/types/source';
import { DataTableWithSearch } from '@/shared/components/widget/table-with-search/DataTable';
import { cn } from '@/shared/lib/utils';

export function UploadsPage() {
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const sourcesQuery = useSources({ initialPageSize: 100 });
  const selectedSource = sourcesQuery.data?.data.find((source) => source.id === selectedSourceId);
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
  } = useUploads({ sourceId: selectedSourceId });
  const uploads = data?.data ?? [];
  const viewFileMutation = useMutation({
    mutationFn: async (upload: UploadItem) => {
      const sourceId = upload.sourceId ?? selectedSourceId;

      if (!sourceId) {
        throw new Error('Source introuvable');
      }

      const response = await uploadService.getUploadFile(sourceId, upload.id);
      const blobUrl = window.URL.createObjectURL(response.data);
      const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');

      if (!opened) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = getUploadFilename(upload);
        link.click();
      }

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
    },
    onError: (viewError) => {
      toast.error(viewError instanceof Error ? viewError.message : 'Visualisation impossible');
    },
  });
  const columns = getUploadColumns((upload) => viewFileMutation.mutate(upload), viewFileMutation.isPending);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Uploads</p>
            <h1 className="text-2xl font-semibold">Validation de fichiers</h1>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
            disabled={!selectedSourceId}
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
                <p className="mt-1 text-sm text-muted-foreground">
                  Selectionne la source dont le schema actif servira a valider le fichier.
                </p>
              </div>
            </div>

            <SourceCombobox
              isLoading={sourcesQuery.isLoading}
              onSelect={setSelectedSourceId}
              selectedSourceId={selectedSourceId}
              sources={sourcesQuery.data?.data ?? []}
            />
          </div>

          <UploadFileForm sourceId={selectedSourceId} />
        </aside>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Historique des uploads</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedSource
                ? `Source: ${selectedSource.name}`
                : 'Selectionne une source pour voir les fichiers envoyes.'}
            </p>
          </div>

          {!selectedSourceId ? (
            <StateCard
              icon={UploadCloud}
              title="Aucune source selectionnee"
              text="Les uploads de la source apparaitront ici."
            />
          ) : isError ? (
            <StateCard
              icon={UploadCloud}
              title="Impossible de charger les uploads"
              text={error instanceof Error ? error.message : 'Erreur inconnue'}
            />
          ) : (
            <DataTableWithSearch
              columns={columns}
              currentPage={data?.pagination.currentPage ?? pagination.page}
              data={uploads}
              emptyMessage="Aucun upload pour cette source"
              initialSearchValue={searchQuery}
              isLoading={isLoading || isFetching}
              onPageChange={changePage}
              onPageSizeChange={changePageSize}
              onSearchChange={setSearchQuery}
              pageSize={data?.pagination.pageSize ?? pagination.pageSize}
              searchPlaceholder="Rechercher un fichier"
              totalItems={data?.pagination.total_elements ?? 0}
              totalPages={data?.pagination.total_pages ?? 1}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function UploadFileForm({ sourceId }: { sourceId: string }) {
  const queryClient = useQueryClient();
  const addWatch = useUploadWatchStore((state) => state.addWatch);
  const [selectedFileName, setSelectedFileName] = useState('');
  const {
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      if (!sourceId) {
        throw new Error('Selectionne une source');
      }

      return (await uploadService.uploadFile(sourceId, data.file)).data;
    },
    onSuccess: (response) => {
      const upload = unwrapUpload(response);

      if (upload?.id) {
        addWatch({
          sourceId: upload.sourceId ?? sourceId,
          uploadId: upload.id,
          fileName: getUploadFilename(upload),
          status: upload.status ?? 'PENDING',
        });
      }

      reset();
      setSelectedFileName('');
      queryClient.invalidateQueries({ queryKey: ['uploads', sourceId] });
      toast.success('Upload recu, traitement en cours');
    },
    onError: (uploadError) => {
      toast.error(getUploadErrorMessage(uploadError));
    },
  });

  return (
    <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit((data) => uploadMutation.mutate(data))}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
          <FileUp className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Nouveau fichier</h2>
          <p className="mt-1 text-sm text-muted-foreground">CSV, XLS ou XLSX. Taille maximale 10 MB.</p>
        </div>
      </div>

      <label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/25 p-5 text-center transition hover:bg-muted/45">
        <UploadCloud className="size-8 text-muted-foreground" />
        <span className="mt-3 text-sm font-medium">
          {selectedFileName || 'Selectionner un fichier'}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">Le traitement demarre apres envoi.</span>
        <input
          accept=".csv,.xls,.xlsx"
          className="sr-only"
          disabled={!sourceId || uploadMutation.isPending}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              setValue('file', file, { shouldDirty: true, shouldValidate: true });
              setSelectedFileName(file.name);
            }
          }}
          type="file"
        />
      </label>
      {errors.file && <FieldError message={errors.file.message} />}
      {uploadMutation.isError && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {getUploadErrorMessage(uploadMutation.error)}
        </div>
      )}

      <button
        className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        disabled={!sourceId || uploadMutation.isPending}
        type="submit"
      >
        {uploadMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        Envoyer le fichier
      </button>
    </form>
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

    return (
      source.name.toLowerCase().includes(search) ||
      (source.description ?? '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="mt-5 space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-10 w-full rounded-md border bg-input pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
          disabled={isLoading}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher une source"
          value={query}
        />
      </div>

      {isOpen && (
        <div className="max-h-64 overflow-y-auto rounded-md border bg-background p-1">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Chargement des sources...</p>
          ) : filteredSources.length ? (
            filteredSources.map((source) => {
              const isSelected = source.id === selectedSourceId;

              return (
                <button
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm hover:bg-muted',
                    isSelected && 'bg-primary/10 text-primary'
                  )}
                  key={source.id}
                  onClick={() => {
                    onSelect(source.id);
                    setQuery('');
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  <span>
                    <span className="block font-medium">{source.name}</span>
                    {source.description && (
                      <span className="block text-xs text-muted-foreground">{source.description}</span>
                    )}
                  </span>
                  {isSelected && <Check className="size-4" />}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">Aucune source trouvee</p>
          )}
        </div>
      )}

      {selectedSource ? (
        <p className="text-xs text-muted-foreground">
          Source selectionnee : <span className="font-medium text-foreground">{selectedSource.name}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Aucune source selectionnee.</p>
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-xs text-destructive">{message}</p>;
}

function getUploadErrorMessage(uploadError: unknown): string {
  if (uploadError instanceof Error) {
    if (/Only CSV, XLS and XLSX/i.test(uploadError.message)) {
      return 'Format non supporte. Envoie un fichier CSV, XLS ou XLSX.';
    }
    if (/file too large|10 MB|too large/i.test(uploadError.message)) {
      return 'Fichier trop lourd. La taille maximale est de 10 MB.';
    }
    return uploadError.message;
  }

  return 'Upload impossible. Verifie le format du fichier et reessaie.';
}

function StateCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof UploadCloud;
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
