'use client';

import { useQueries } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  FileWarning,
  Layers3,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useMemo, useState } from 'react';
import { schemaVersionService } from '@/features/schemas/api/schema-version-service';
import type { SchemaVersion, SchemaVersionListResponse } from '@/features/schemas/types/schema-version';
import { useSources } from '@/features/sources/hooks/use-sources';
import type { Source } from '@/features/sources/types/source';
import { SearchBar } from '@/shared/components/widget/search-bar/search-bar';
import { useUserStore } from '@/shared/stores/user-store';

const workflow = [
  { label: 'Auth', done: true },
  { label: 'Sources', done: true },
  { label: 'Schemas', done: true },
  { label: 'Uploads', done: false },
  { label: 'Erreurs', done: false },
];

const nextSprints = [
  {
    title: 'Uploads',
    text: 'Depot CSV/XLS/XLSX, statut asynchrone et polling toutes les 2 ou 3 secondes.',
    icon: UploadCloud,
    href: '#',
    status: 'Prochain sprint',
  },
  {
    title: 'Erreurs de validation',
    text: 'Lecture des lignes invalides, colonnes concernees et messages metier.',
    icon: FileWarning,
    href: '#',
    status: 'Apres uploads',
  },
];

export function DashboardHome() {
  const { theme, setTheme } = useTheme();
  const user = useUserStore((state) => state.session?.user);
  const [search, setSearch] = useState('');
  const sourcesQuery = useSources({ initialPageSize: 100 });
  const sources = useMemo(() => sourcesQuery.data?.data ?? [], [sourcesQuery.data?.data]);
  const schemaQueries = useQueries({
    queries: sources.map((source) => ({
      queryKey: ['schema-versions', source.id, 'dashboard'],
      queryFn: async () => unwrapSchemaVersions((await schemaVersionService.listVersions(source.id, { page: 1, page_size: 100 })).data),
      enabled: Boolean(source.id),
    })),
  });

  const schemaVersions = schemaQueries.flatMap((query) => query.data ?? []);
  const activeSchemas = schemaVersions.filter((version) => version.isActive).length;
  const draftSchemas = schemaVersions.filter((version) => !version.isActive && !version.publishedAt && version.status !== 'PUBLISHED').length;
  const isSchemasLoading = schemaQueries.some((query) => query.isLoading || query.isFetching);
  const filteredSources = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sources.slice(0, 5);
    }

    return sources
      .filter((source) =>
        source.name.toLowerCase().includes(query) ||
        (source.description ?? '').toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [search, sources]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard</p>
            <h1 className="text-2xl font-semibold">Bienvenue{user?.name ? `, ${user.name}` : ''}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden w-72 md:block">
              <SearchBar onSearch={setSearch} placeholder="Rechercher une source" search={search} />
            </div>
            <button
              className="grid size-10 place-items-center rounded-md border bg-card hover:bg-muted"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              type="button"
            >
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Socle MVP actif
          </div>
          <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
            Controle les sources, publie les schemas, puis branche les validations de fichiers.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Le dashboard suit l&apos;avancement des modules deja branches et garde les prochaines actions accessibles sans
            surcharger les pages metier.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              href="/sources"
            >
              <Plus className="size-4" />
              Gerer les sources
            </Link>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
              href="/schemas"
            >
              Gerer les schemas
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Parcours MVP</h2>
          <div className="mt-5 space-y-3">
            {workflow.map((item, index) => (
              <div className="flex items-center gap-3" key={item.label}>
                <div className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: item.done ? '100%' : '18%' }} />
                  </div>
                </div>
                {item.done ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <Clock3 className="size-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={sourcesQuery.isLoading ? 'Chargement...' : 'Sources configurees'}
          icon={Database}
          label="Sources"
          value={String(sourcesQuery.data?.pagination.total_elements ?? sources.length)}
        />
        <MetricCard
          detail={isSchemasLoading ? 'Chargement...' : 'Versions creees'}
          icon={Layers3}
          label="Schemas"
          value={String(schemaVersions.length)}
        />
        <MetricCard
          detail="Version publiee par source"
          icon={CheckCircle2}
          label="Schemas actifs"
          value={String(activeSchemas)}
        />
        <MetricCard
          detail="A finaliser ou publier"
          icon={Activity}
          label="Brouillons"
          value={String(draftSchemas)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Sources recentes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? 'Resultats correspondant a la recherche.' : 'Dernieres sources chargees depuis le backend.'}
              </p>
            </div>
            <Link className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted" href="/sources">
              Tout voir
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {sourcesQuery.isLoading ? (
              <EmptyState text="Chargement des sources..." />
            ) : filteredSources.length ? (
              filteredSources.map((source) => <SourceRow key={source.id} source={source} />)
            ) : (
              <EmptyState text={search ? 'Aucune source ne correspond a la recherche.' : 'Aucune source pour le moment.'} />
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Prochains sprints</h2>
          <div className="mt-5 space-y-3">
            {nextSprints.map((card) => {
              const Icon = card.icon;

              return (
                <article className="rounded-lg border bg-background p-4" key={card.title}>
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{card.title}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{card.text}</p>
                      <p className="mt-3 text-xs font-medium text-primary">{card.status}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function unwrapSchemaVersions(payload: SchemaVersionListResponse): SchemaVersion[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.data && !Array.isArray(payload.data)) {
    return payload.data.content ?? [];
  }

  return payload.content ?? [];
}

function SourceRow({ source }: { source: Source }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Database className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{source.name}</p>
          <p className="truncate text-xs text-muted-foreground">{source.description || 'Aucune description'}</p>
        </div>
      </div>
      <span className="hidden text-xs text-muted-foreground sm:block">{formatDate(source.createdAt)}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/25 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
