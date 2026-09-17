'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  Gauge,
  FileText,
  FileWarning,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useMemo, useState } from 'react';
import { dashboardService } from '@/features/dashboard/api/dashboard-service';
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
  });
  const stats = statsQuery.data;
  const isStatsLoading = statsQuery.isLoading || (!stats && statsQuery.isFetching);
  const isStatsUnavailable = statsQuery.isError || !stats;

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
            {isStatsLoading ? 'Chargement des statistiques' : `Statistiques ${getPeriodLabel(period)}`}
          </div>
          <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
            Vue claire sur la qualite des fichiers, les erreurs et les sources a surveiller.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Les indicateurs ci-dessous distinguent les fichiers vraiment valides, ceux termines avec erreurs metier et les echecs techniques.
          </p>
          {isStatsUnavailable && !isStatsLoading && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4" />
              <span>Les statistiques backend sont indisponibles pour le moment.</span>
              <button
                className="ml-auto inline-flex h-8 items-center gap-2 rounded-md border border-destructive/30 px-3 text-xs font-medium"
                onClick={() => statsQuery.refetch()}
                type="button"
              >
                <RefreshCw className="size-3.5" />
                Reessayer
              </button>
            </div>
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

        {isStatsLoading ? <QualityDonutSkeleton /> : stats ? <QualityOverview stats={stats} /> : <StatsUnavailableCard />}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isStatsLoading ? (
          <MetricCardSkeleton count={4} />
        ) : stats ? (
          <>
            <MetricCard detail="Tous statuts confondus" icon={UploadCloud} label="Fichiers ingeres" value={stats.summary.totalUploads} />
            <MetricCard detail="Fichiers valides sans erreur" icon={CheckCircle2} label="Taux de succes" suffix="%" value={stats.summary.successRate} />
            <MetricCard detail="Fichiers avec erreurs ou echecs" icon={FileWarning} label="Taux d'erreurs" suffix="%" value={stats.summary.errorRate} tone="danger" />
            <MetricCard detail="Toutes sources confondues" icon={FileWarning} label="Lignes invalides" value={stats.summary.totalInvalidRows} tone="danger" />
          </>
        ) : (
          <StatsUnavailableCard className="md:col-span-2 xl:col-span-4" />
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        {isStatsLoading ? (
          <>
            <PanelSkeleton />
            <PanelSkeleton />
          </>
        ) : stats ? (
          <>
            <SourceQualityChart data={stats.uploadsBySource} />
            <MostActiveSources sources={stats.mostActiveSources} />
          </>
        ) : (
          <StatsUnavailableCard className="xl:col-span-2" />
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {isStatsLoading ? <PanelSkeleton /> : stats ? <ErrorTypesBreakdown stats={stats} /> : <StatsUnavailableCard />}
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
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-80 sm:flex-row">
            <SearchBar onSearch={setSearch} placeholder="Rechercher une source" search={search} />
            <Link className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm hover:bg-muted" href="/sources">
              Tout voir
              <ArrowRight className="size-4" />
            </Link>
          </div>
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

function QualityOverview({ stats }: { stats: DashboardStats }) {
  const totalUploads = Math.max(1, stats.summary.totalUploads);
  const success = getPercent(stats.summary.successfulUploads, totalUploads);
  const withErrors = getPercent(stats.summary.uploadsWithErrors, totalUploads);
  const failed = getPercent(stats.summary.failedUploads, totalUploads);
  const qualityScore = Math.max(0, Math.round(stats.summary.successRate));
  const riskLevel = getRiskLevel(stats.summary.errorRate, stats.summary.failedUploads);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Qualite globale</h2>
          <p className="mt-1 text-sm text-muted-foreground">{riskLevel}</p>
        </div>
        <Gauge className="size-5 text-primary" />
      </div>

      <div className="mt-6 flex items-center justify-center">
        <div className="relative grid size-52 place-items-center">
          <svg className="size-full -rotate-90" viewBox="0 0 120 120" role="img" aria-label={`Score qualite ${qualityScore}%`}>
            <circle className="text-muted" cx="60" cy="60" fill="none" r="48" stroke="currentColor" strokeWidth="12" />
            <circle
              className="text-primary"
              cx="60"
              cy="60"
              fill="none"
              r="48"
              stroke="currentColor"
              strokeDasharray={`${qualityScore * 3.02} 302`}
              strokeLinecap="round"
              strokeWidth="12"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-4xl font-semibold">{qualityScore}%</p>
            <p className="text-xs text-muted-foreground">sans erreur</p>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-md border bg-muted">
        <div className="flex h-3 w-full">
          <div className="bg-primary" style={{ width: `${success}%` }} />
          <div className="bg-yellow-500" style={{ width: `${withErrors}%` }} />
          <div className="bg-destructive" style={{ width: `${failed}%` }} />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <LegendItem color="bg-primary" label="Valides" value={`${stats.summary.successfulUploads} (${success}%)`} />
        <LegendItem color="bg-yellow-500" label="Avec erreurs metier" value={`${stats.summary.uploadsWithErrors} (${withErrors}%)`} />
        <LegendItem color="bg-destructive" label="Echecs techniques" value={`${stats.summary.failedUploads} (${failed}%)`} />
      </div>
    </div>
  );
}

function unwrapDashboardStats(payload: DashboardStatsResponse): DashboardStats {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Dashboard stats response is invalid');
  }

  if ('data' in payload && payload.data) {
    if (!isDashboardStats(payload.data)) {
      throw new Error('Dashboard stats response is invalid');
    }

    return payload.data;
  }

  if (!isDashboardStats(payload)) {
    throw new Error('Dashboard stats response is invalid');
  }

  return payload as DashboardStats;
}

function isDashboardStats(payload: unknown): payload is DashboardStats {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const stats = payload as Partial<DashboardStats>;

  return (
    Boolean(stats.summary) &&
    Array.isArray(stats.uploadsBySource) &&
    Array.isArray(stats.mostActiveSources) &&
    Array.isArray(stats.errorTypes)
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

function MetricCardSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div className="rounded-lg border bg-card p-4 shadow-sm" key={index}>
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="size-4 rounded-full" />
          </div>
          <SkeletonBlock className="mt-4 h-8 w-20" />
          <SkeletonBlock className="mt-3 h-4 w-36" />
        </div>
      ))}
    </>
  );
}

function QualityDonutSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <SkeletonBlock className="h-5 w-48" />
      <div className="mt-6 flex items-center justify-center">
        <SkeletonBlock className="size-48 rounded-full" />
      </div>
      <div className="mt-6 space-y-3">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
        <SkeletonBlock className="h-4 w-4/6" />
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <SkeletonBlock className="h-5 w-56" />
      <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-6 space-y-4">
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-4/5" />
      </div>
    </div>
  );
}

function StatsUnavailableCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-dashed bg-card p-5 text-sm text-muted-foreground shadow-sm', className)}>
      <div className="flex items-center gap-2 font-medium text-foreground">
        <AlertCircle className="size-4 text-destructive" />
        Statistiques indisponibles
      </div>
      <p className="mt-2">Aucune donnee de demonstration n&apos;est affichee lorsque le backend ne repond pas.</p>
    </div>
  );
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

function SourceQualityChart({ data }: { data: DashboardUploadsBySource[] }) {
  const sortedSources = [...data].sort((a, b) => b.totalUploads - a.totalUploads).slice(0, 8);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Qualite par source</h2>
          <p className="mt-1 text-sm text-muted-foreground">Uploads valides, avec erreurs metier et echecs techniques.</p>
        </div>
        <BarChart3 className="size-5 text-primary" />
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <LegendPill color="bg-primary" label="Valides" />
        <LegendPill color="bg-yellow-500" label="Erreurs metier" />
        <LegendPill color="bg-destructive" label="Echecs" />
      </div>

      <div className="mt-6 space-y-5">
        {sortedSources.length ? (
          sortedSources.map((source) => {
            const total = Math.max(1, source.totalUploads);
            const success = getPercent(source.successfulUploads, total);
            const withErrors = getPercent(source.uploadsWithErrors, total);
            const failed = getPercent(source.failedUploads, total);

            return (
              <div key={source.sourceId}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{source.sourceName}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {source.totalUploads} fichier{source.totalUploads > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex h-5 overflow-hidden rounded-md bg-muted">
                  <div className="bg-primary" style={{ width: `${success}%` }} title={`${success}% valides`} />
                  <div className="bg-yellow-500" style={{ width: `${withErrors}%` }} title={`${withErrors}% avec erreurs`} />
                  <div className="bg-destructive" style={{ width: `${failed}%` }} title={`${failed}% en echec`} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{source.invalidRows} lignes invalides</span>
                  <span>{success}% sans erreur</span>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyChartState text="Aucune source avec upload sur cette periode." />
        )}
      </div>
    </div>
  );
}

function MostActiveSources({ sources }: { sources: DashboardActiveSource[] }) {
  const maxUploads = Math.max(1, ...sources.map((source) => source.totalUploads));

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Sources a surveiller</h2>
          <p className="mt-1 text-sm text-muted-foreground">Classement par activite et qualite recente.</p>
        </div>
        <TrendingUp className="size-5 text-primary" />
      </div>
      <div className="mt-5 space-y-3">
        {sources.length ? (
          sources.map((source, index) => {
            const qualityTone = source.invalidRows > 0 || source.successRate < 80 ? 'danger' : 'default';

            return (
              <div className="rounded-lg border bg-background p-3" key={source.sourceId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {index + 1}. {source.sourceName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Dernier upload: {formatDate(source.lastUploadAt)}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      qualityTone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                    )}
                  >
                    {source.successRate}% OK
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(source.totalUploads / maxUploads) * 100}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>{source.totalUploads} fichiers</span>
                  <span>{source.invalidRows} lignes invalides</span>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyChartState text="Aucune source active sur cette periode." />
        )}
      </div>
    </div>
  );
}

function ErrorTypesBreakdown({ stats }: { stats: DashboardStats }) {
  const total = Math.max(1, stats.errorTypes.reduce((sum, item) => sum + item.count, 0));
  const sortedErrors = [...stats.errorTypes].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Erreurs les plus frequentes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Les causes qui pesent le plus dans les lignes invalides.</p>
        </div>
        <FileWarning className="size-5 text-destructive" />
      </div>

      <div className="mt-6 space-y-4">
        {sortedErrors.length ? (
          sortedErrors.map((error) => {
            const percent = getPercent(error.count, total);

            return (
              <div key={error.type}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{error.label}</p>
                    {/*<p className="text-xs text-muted-foreground">{error.type}</p>*/}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{error.count}</p>
                    <p className="text-xs text-muted-foreground">{percent}%</p>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-destructive" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <EmptyChartState text="Aucune erreur detectee sur cette periode." />
        )}
      </div>
    </div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn('size-2.5 rounded-full', color)} />
      {label}
    </span>
  );
}

function EmptyChartState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/25 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function getRiskLevel(errorRate: number, failedUploads: number) {
  if (failedUploads > 0) {
    return 'Des echecs techniques demandent une verification.';
  }

  if (errorRate >= 30) {
    return 'La qualite des fichiers est a surveiller.';
  }

  if (errorRate > 0) {
    return 'Quelques erreurs metier a corriger.';
  }

  return 'Les uploads sont propres sur la periode.';
}

function getPercent(value: number, total: number) {
  return Math.round((value / Math.max(1, total)) * 1000) / 10;
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
