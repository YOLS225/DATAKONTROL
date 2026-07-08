'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  Database,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { sourceService } from '@/features/sources/api/source-service';
import { getSourceColumns } from '@/features/sources/components/source-columns';
import { useSources } from '@/features/sources/hooks/use-sources';
import { sourceSchema, type SourceFormData } from '@/features/sources/schemas/source-schema';
import type { Source } from '@/features/sources/types/source';
import { ConfirmDialog } from '@/shared/components/widget/confirm-dialog';
import { DataTableWithSearch } from '@/shared/components/widget/table-with-search/DataTable';
import { cn } from '@/shared/lib/utils';

export function SourcesPage() {
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
  const queryClient = useQueryClient();
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
  } = useSources();
  const sources = data?.data ?? [];
  const deleteMutation = useMutation({
    mutationFn: async (source: Source) => {
      await sourceService.deleteSource(source.id);
      return source;
    },
    onSuccess: (deletedSource) => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast.success(`Source ${deletedSource.name} supprimee`);
    },
    onError: (deleteError) => {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Suppression impossible');
    },
  });
  const handleDeleteSource = useCallback((source: Source) => {
    setSourceToDelete(source);
  }, []);
  const columns = useMemo(
    () =>
      getSourceColumns(
        (source) => setEditingSource(source),
        handleDeleteSource,
        deleteMutation.variables?.id
      ),
    [deleteMutation.variables?.id, handleDeleteSource]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Sources</p>
            <h1 className="text-2xl font-semibold">Types de donnees a controler</h1>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
            onClick={() => refetch()}
            type="button"
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            Actualiser
          </button>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-5">
          <CreateSourceForm />

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <div>
                <h2 className="text-base font-semibold">Liste des sources</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recherche, pagination et selection rapide.
                </p>
              </div>
            </div>

            {isError ? (
              <StateCard
                icon={Database}
                title="Impossible de charger les sources"
                text={error instanceof Error ? error.message : 'Erreur inconnue'}
              />
            ) : (
              <DataTableWithSearch
                columns={columns}
                currentPage={data?.pagination.currentPage ?? pagination.page}
                data={sources}
                emptyMessage="Aucune source ne correspond a cette recherche"
                initialSearchValue={searchQuery}
                isLoading={isLoading || isFetching}
                onPageChange={changePage}
                onPageSizeChange={changePageSize}
                onSearchChange={setSearchQuery}
                pageSize={data?.pagination.pageSize ?? pagination.pageSize}
                searchPlaceholder="Rechercher une source"
                totalItems={data?.pagination.total_elements ?? 0}
                totalPages={data?.pagination.total_pages ?? 1}
              />
            )}
          </div>
        </div>

        <EditSourceDialog
          onClose={() => setEditingSource(null)}
          open={Boolean(editingSource)}
          source={editingSource}
        />
        <ConfirmDialog
          confirmLabel="Supprimer"
          description="Cette action est possible uniquement si la source n'est liee a aucun schema et aucun upload."
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            if (sourceToDelete) {
              deleteMutation.mutate(sourceToDelete, {
                onSuccess: () => setSourceToDelete(null),
              });
            }
          }}
          onOpenChange={(open) => {
            if (!open && !deleteMutation.isPending) {
              setSourceToDelete(null);
            }
          }}
          open={Boolean(sourceToDelete)}
          title={sourceToDelete ? `Supprimer ${sourceToDelete.name}` : 'Supprimer la source'}
        />
      </section>
    </div>
  );
}

function CreateSourceForm() {
  const queryClient = useQueryClient();
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SourceFormData) => (await sourceService.createSource(data)).data,
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast.success('Source creee');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Creation impossible');
    },
  });

  return (
    <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Nouvelle source</h2>
          <p className="mt-1 text-sm text-muted-foreground">Declare un nouveau type de donnees a valider.</p>
        </div>
        <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Plus className="size-5" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Nom</span>
          <input
            className="dk-input mt-2"
            placeholder="Ex: ODCI-Hebdo"
            {...register('name')}
          />
          {errors.name && <FieldError message={errors.name.message} />}
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <input
            className="dk-input mt-2"
            placeholder="Ex: weekly report"
            {...register('description')}
          />
          {errors.description && <FieldError message={errors.description.message} />}
        </label>
      </div>

      <button
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        disabled={createMutation.isPending}
        type="submit"
      >
        {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Creer la source
      </button>
    </form>
  );
}

function EditSourceDialog({
  source,
  open,
  onClose,
}: {
  source: Source | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!source) {
    return null;
  }

  return (
    <Dialog.Root
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-5 text-card-foreground shadow-xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in md:p-6">
          <EditSourceForm key={source.id} onClose={onClose} source={source} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EditSourceForm({ source, onClose }: { source: Source; onClose: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      name: source?.name ?? '',
      description: source?.description ?? '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SourceFormData) => {
      return (await sourceService.updateSource(source.id, data)).data;
    },
    onSuccess: (updatedSource) => {
      reset({
        name: updatedSource.name ?? '',
        description: updatedSource.description ?? '',
      });
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast.success('Source modifiee');
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Modification impossible');
    },
  });

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Modification</p>
          <Dialog.Title className="mt-1 text-xl font-semibold">{source.name}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Mets a jour les informations visibles dans la liste des sources.
          </Dialog.Description>
        </div>
        <Dialog.Close
          className="grid size-10 place-items-center rounded-md border hover:bg-muted"
          type="button"
        >
          <X className="size-4" />
        </Dialog.Close>
      </div>

      <form
        className="mt-5 space-y-4"
        onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
      >
        <label className="block">
          <span className="text-sm font-medium">Nom</span>
          <input
            className="dk-input mt-2"
            placeholder="Ex: ODCI-Hebdo corrige"
            {...register('name')}
          />
          {errors.name && <FieldError message={errors.name.message} />}
        </label>

        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea
            className="min-h-28 w-full rounded-md border bg-input px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
            placeholder="Ex: Nouveau descriptif"
            {...register('description')}
          />
          {errors.description && <FieldError message={errors.description.message} />}
        </label>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Dialog.Close
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            disabled={updateMutation.isPending}
            type="button"
          >
            Annuler
          </Dialog.Close>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            disabled={updateMutation.isPending}
            type="submit"
          >
            {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
            Enregistrer
          </button>
        </div>
      </form>
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function StateCard({
  icon: Icon,
  title,
  text,
  spin = false,
}: {
  icon: typeof Database;
  title: string;
  text: string;
  spin?: boolean;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/25 p-8 text-center">
      <Icon className={cn('mx-auto size-9 text-muted-foreground', spin && 'animate-spin')} />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
