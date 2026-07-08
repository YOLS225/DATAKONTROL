'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Layers3, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  schemaVersionService,
  type SchemaVersionResponse,
} from '@/features/schemas/api/schema-version-service';
import { SchemaColumnsFields } from '@/features/schemas/components/schema-columns-fields';
import {
  schemaVersionSchema,
  type SchemaVersionFormData,
} from '@/features/schemas/schemas/schema-version-schema';
import type { SchemaVersion } from '@/features/schemas/types/schema-version';
import { ConfirmDialog } from '@/shared/components/widget/confirm-dialog';
import { cn } from '@/shared/lib/utils';

const emptyColumn: SchemaVersionFormData['columns'][number] = {
  id: '',
  name: '',
  type: 'string',
  required: true,
};

export function SchemaVersionDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sourceId = searchParams.get('sourceId') ?? '';
  const versionId = params.id;

  const schemaVersionQuery = useQuery({
    queryKey: ['schema-version', sourceId, versionId],
    queryFn: async () => {
      const schemaVersion = unwrapSchemaVersion((await schemaVersionService.getVersion(sourceId, versionId)).data);

      if (!schemaVersion) {
        throw new Error('Reponse schema invalide');
      }

      return schemaVersion;
    },
    enabled: Boolean(sourceId && versionId),
  });

  if (!sourceId) {
    return (
      <StateCard
        title="Source introuvable"
        text="Le detail du schema doit etre ouvert depuis une source."
      />
    );
  }

  if (schemaVersionQuery.isLoading) {
    return (
      <StateCard
        icon={<Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />}
        title="Chargement du schema"
        text="Recuperation des colonnes et du statut."
      />
    );
  }

  if (schemaVersionQuery.isError || !schemaVersionQuery.data) {
    return (
      <StateCard
        title="Schema introuvable"
        text={schemaVersionQuery.error instanceof Error ? schemaVersionQuery.error.message : 'Impossible de charger ce schema.'}
      />
    );
  }

  return <SchemaVersionDetailForm sourceId={sourceId} version={schemaVersionQuery.data} />;
}

function SchemaVersionDetailForm({ sourceId, version }: { sourceId: string; version: SchemaVersion }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isActive = version.isActive === true;
  const isPublished = isActive || Boolean(version.publishedAt) || version.status === 'PUBLISHED';
  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<SchemaVersionFormData>({
    resolver: zodResolver(schemaVersionSchema),
    defaultValues: {
      columns: version.schemaDefinition?.columns?.length ? version.schemaDefinition.columns : [emptyColumn],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'columns' });

  const updateMutation = useMutation({
    mutationFn: async (data: SchemaVersionFormData) => {
      const response = await schemaVersionService.updateDraft(sourceId, version.id, {
        schemaDefinition: {
          columns: data.columns,
        },
      });
      const updatedVersion = unwrapSchemaVersion(response.data);

      return updatedVersion ?? {
        ...version,
        schemaDefinition: {
          columns: data.columns,
        },
      };
    },
    onSuccess: (updatedVersion) => {
      reset({
        columns: updatedVersion.schemaDefinition?.columns?.length
          ? updatedVersion.schemaDefinition.columns
          : [emptyColumn],
      });
      queryClient.setQueryData(['schema-version', sourceId, version.id], updatedVersion);
      queryClient.invalidateQueries({ queryKey: ['schema-version', sourceId, version.id] });
      queryClient.invalidateQueries({ queryKey: ['schema-versions', sourceId] });
      toast.success('Schema modifie');
    },
    onError: (updateError) => {
      toast.error(updateError instanceof Error ? updateError.message : 'Modification impossible');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => schemaVersionService.deleteVersion(sourceId, version.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema-versions', sourceId] });
      toast.success('Schema supprime');
      router.push('/schemas');
    },
    onError: (deleteError) => {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Suppression impossible');
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              href="/schemas"
            >
              <ArrowLeft className="size-4" />
              Retour aux schemas
            </Link>
            <p className="text-sm text-muted-foreground">Detail du schema</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">
                {version.version ? `Version ${version.version}` : version.id.slice(0, 8)}
              </h1>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isActive ? 'Actif' : isPublished ? 'Publie' : 'Brouillon'}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {isPublished
                ? 'Cette version est publiee. Tu peux consulter ses colonnes.'
                : 'Tu peux modifier les colonnes de ce brouillon.'}
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isActive || deleteMutation.isPending}
            onClick={() => setIsDeleteDialogOpen(true)}
            title={isActive ? 'Une version active ne peut pas etre supprimee' : undefined}
            type="button"
          >
            {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Supprimer
          </button>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Colonnes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {fields.length} colonne{fields.length > 1 ? 's' : ''} definie{fields.length > 1 ? 's' : ''}
              </p>
            </div>
            {!isPublished && (
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted"
                onClick={() => append({ id: `column-${Date.now()}`, name: '', type: 'string', required: false })}
                type="button"
              >
                <Plus className="size-4" />
                Ajouter une colonne
              </button>
            )}
          </div>

          <fieldset disabled={isPublished || updateMutation.isPending}>
            <SchemaColumnsFields
              errors={errors}
              fields={fields}
              readonly={isPublished}
              register={register}
              remove={remove}
            />
          </fieldset>

          {!isPublished && (
            <button
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={updateMutation.isPending}
              type="submit"
            >
              {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Layers3 className="size-4" />}
              Enregistrer les modifications
            </button>
          )}
        </form>
      </section>

      <ConfirmDialog
        confirmLabel="Supprimer"
        description="Seules les versions non publiees peuvent etre supprimees. Une version active ou deja publiee sera refusee par l'API."
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setIsDeleteDialogOpen(false);
          }
        }}
        open={isDeleteDialogOpen}
        title={version.version ? `Supprimer la version ${version.version}` : 'Supprimer ce brouillon'}
      />
    </div>
  );
}

function unwrapSchemaVersion(payload: SchemaVersionResponse): SchemaVersion | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if ('data' in payload) {
    return payload.data ?? null;
  }

  if ('id' in payload) {
    return payload;
  }

  return null;
}

function StateCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/25 p-8 text-center">
      {icon ?? <Layers3 className="mx-auto size-9 text-muted-foreground" />}
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
