'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  FileWarning,
  Moon,
  ShieldCheck,
  Sun,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useMemo, useState } from 'react';
import { dashboardService } from '@/features/dashboard/api/dashboard-service';
import { mockDashboardStats } from '@/features/dashboard/constants/mock-dashboard-stats';
import type {
  DashboardActiveSource,
  DashboardPeriod,
  DashboardStats,
  DashboardStatsResponse,
  DashboardUploadsBySource,
} from '@/features/dashboard/types/dashboard-stats';
import { useSources } from '@/features/sources/hooks/use-sources';
import type { Source } from '@/features/sources/types/source';
import { SearchBar } from '@/shared/components/widget/search-bar/search-bar';
import { cn } from '@/shared/lib/utils';
import { useUserStore } from '@/shared/stores/user-store';

const activeModules = [
  { title: 'Sources', text: 'Referentiel des donnees a controler.', href: '/sources', icon: Database },
  { title: 'Schemas', text: 'Versions et colonnes attendues.', href: '/schemas', icon: BarChart3 },
  { title: 'Uploads', text: 'Depot, polling et notifications.', href: '/uploads', icon: UploadCloud },
  { title: 'Rapports', text: 'Erreurs ligne, colonne et type.', href: '/reports', icon: FileText },
];

export function DashboardHome() {
  const { theme, setTheme } = useTheme();
  const user = useUserStore((state) => state.session?.user);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const sourcesQuery = useSources({ initialPageSize: 100 });
  const sources = useMemo(() => sourcesQuery.data?.data ?? [], [sourcesQuery.data?.data]);
  const filteredSources = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sources.slice(0, 5);
    }

    return sources
      .filter((source) => source.name.toLowerCase().includes(query) || (source.description ?? '').toLowerCase().includes(query))
      .slice(0, 5);
  }, [search, sources]);

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', period],
    queryFn: async () => unwrapDashboardStats((await dashboardService.getStats({ period })).data),
    placeholderData: mockDashboardStats,
  });
  const stats = statsQuery.data ?? mockDashboardStats;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard</p>
            <h1 className="text-2xl font-semibold">Bienvenue{user?.name ? `, ${user.name}` : ''}</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-md border bg-input px-3 text-sm outline-none"
              onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}
              value={period}
            >
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
              <option value="90d">90 jours</option>
              <option value="all">Tout</option>
            </select>

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
            {statsQuery.isPlaceholderData ? 'Chargement des statistiques' : `Statistiques ${getPeriodLabel(period)}`}
          </div>
          <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
            Suivre les fichiers ingeres, la qualite des validations et les sources les plus actives.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Les statistiques pour suivre la qualite des validations.
          </p>
          {statsQuery.isError && (
            <p className="mt-3 text-sm text-destructive">
              Les statistiques backend sont indisponibles, affichage temporaire des donnees de demonstration.
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              href="/uploads"
            >
              <UploadCloud className="size-4" />
              Envoyer un fichier
            </Link>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
              href="/reports"
            >
              Voir les rapports
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <QualityDonut stats={stats} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Tous statuts confondus" icon={UploadCloud} label="Fichiers ingeres" value={stats.summary.totalUploads} />
        <MetricCard detail="Fichiers valides sans erreur" icon={CheckCircle2} label="Taux de succes" suffix="%" value={stats.summary.successRate} />
        <MetricCard detail="Fichiers avec erreurs ou echecs" icon={FileWarning} label="Taux d'erreurs" suffix="%" value={stats.summary.errorRate} tone="danger" />
        <MetricCard detail="Toutes sources confondues" icon={FileWarning} label="Lignes invalides" value={stats.summary.totalInvalidRows} tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <UploadsBySourceChart data={stats.uploadsBySource} />
        <MostActiveSources sources={stats.mostActiveSources} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ErrorTypesBreakdown stats={stats} />
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Modules actifs</h2>
          <div className="mt-5 space-y-3">
            {activeModules.map((card) => {
              const Icon = card.icon;

              return (
                <Link className="block rounded-lg border bg-background p-4 transition hover:bg-muted/45" href={card.href} key={card.title}>
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{card.title}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{card.text}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Sources recentes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Resultats correspondant a la recherche.' : 'Dernieres sources chargees.'}
            </p>
          </div>
          <Link className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted" href="/sources">
            Tout voir
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sourcesQuery.isLoading ? (
            <EmptyState text="Chargement des sources..." />
          ) : filteredSources.length ? (
            filteredSources.map((source) => <SourceRow key={source.id} source={source} />)
          ) : (
            <EmptyState text={search ? 'Aucune source ne correspond a la recherche.' : 'Aucune source pour le moment.'} />
          )}
        </div>
      </section>
    </div>
  );
}

function QualityDonut({ stats }: { stats: DashboardStats }) {
  const success = stats.summary.successRate;
  const failed = Math.round((stats.summary.failedUploads / Math.max(1, stats.summary.totalUploads)) * 1000) / 10;
  const withErrors = Math.max(0, Math.round((100 - success - failed) * 10) / 10);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">Taux de succes et d&apos;erreurs</h2>
      <div className="mt-6 flex items-center justify-center">
        <div
          className="grid size-48 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) 0 ${success}%, oklch(0.769 0.188 70.08) ${success}% ${success + withErrors}%, var(--destructive) ${success + withErrors}% 100%)`,
          }}
        >
          <div className="grid size-32 place-items-center rounded-full bg-card text-center">
            <div>
              <p className="text-3xl font-semibold">{success}%</p>
              <p className="text-xs text-muted-foreground">succes</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <LegendItem color="bg-primary" label="Succes" value={`${success}%`} />
        <LegendItem color="bg-yellow-500" label="Termine avec erreurs" value={`${withErrors}%`} />
        <LegendItem color="bg-destructive" label="Echec technique" value={`${failed}%`} />
      </div>
    </div>
  );
}

function unwrapDashboardStats(payload: DashboardStatsResponse): DashboardStats {
  if (!payload || typeof payload !== 'object') {
    return mockDashboardStats;
  }

  if ('data' in payload && payload.data) {
    return payload.data;
  }

  return payload as DashboardStats;
}

function getPeriodLabel(period: DashboardPeriod) {
  if (period === '7d') {
    return '7 jours';
  }

  if (period === '90d') {
    return '90 jours';
  }

  if (period === 'all') {
    return 'globales';
  }

  return '30 jours';
}

function UploadsBySourceChart({ data }: { data: DashboardUploadsBySource[] }) {
  const maxUploads = Math.max(1, ...data.map((source) => source.totalUploads));

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Fichiers ingeres par source</h2>
          <p className="mt-1 text-sm text-muted-foreground">Volume d&apos;uploads par source sur la periode.</p>
        </div>
        <BarChart3 className="size-5 text-primary" />
      </div>
      <div className="mt-6 space-y-4">
        {data.map((source) => (
          <div key={source.sourceId}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{source.sourceName}</span>
              <span className="text-muted-foreground">{source.totalUploads}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(source.totalUploads / maxUploads) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MostActiveSources({ sources }: { sources: DashboardActiveSource[] }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">Sources les plus actives</h2>
      <div className="mt-5 space-y-3">
        {sources.map((source, index) => (
          <div className="rounded-lg border bg-background p-3" key={source.sourceId}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {index + 1}. {source.sourceName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Dernier upload: {formatDate(source.lastUploadAt)}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {source.totalUploads} fichiers
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Succes: {source.successRate}%</span>
              <span>Lignes invalides: {source.invalidRows}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorTypesBreakdown({ stats }: { stats: DashboardStats }) {
  const total = Math.max(1, stats.errorTypes.reduce((sum, item) => sum + item.count, 0));

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">Repartition des erreurs</h2>
      <p className="mt-1 text-sm text-muted-foreground">Typologie des erreurs de validation detectees.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {stats.errorTypes.map((error) => (
          <div className="rounded-lg border bg-background p-4" key={error.type}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{error.label}</p>
              <span className="text-sm text-muted-foreground">{error.count}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-destructive" style={{ width: `${(error.count / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  suffix = '',
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: number;
  detail: string;
  suffix?: string;
  icon: typeof ShieldCheck;
  tone?: 'default' | 'danger';
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={cn('size-4', tone === 'danger' ? 'text-destructive' : 'text-primary')} />
      </div>
      <p className={cn('mt-3 text-3xl font-semibold', tone === 'danger' && 'text-destructive')}>
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className={cn('size-2.5 rounded-full', color)} />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
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
