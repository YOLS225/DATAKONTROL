'use client';

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
import { useTheme } from 'next-themes';
import { SearchBar } from '@/shared/components/widget/search-bar/search-bar';
import { useState } from 'react';

const sprintCards = [
  {
    title: 'Sources',
    text: 'Creation et recherche des sources de donnees.',
    icon: Database,
    status: 'Sprint suivant',
  },
  {
    title: 'Schemas',
    text: 'Brouillons, colonnes attendues et publication.',
    icon: Layers3,
    status: 'A planifier',
  },
  {
    title: 'Uploads',
    text: 'Depot CSV/XLSX, polling et statut de traitement.',
    icon: UploadCloud,
    status: 'A planifier',
  },
  {
    title: 'Erreurs',
    text: 'Lecture des erreurs ligne par ligne apres validation.',
    icon: FileWarning,
    status: 'A planifier',
  },
];

export function DashboardHome() {
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard</p>
            <h1 className="text-2xl font-semibold">Bienvenue sur DATAKONTROL</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden w-72 md:block">
              <SearchBar onSearch={setSearch} placeholder="Rechercher dans le workspace" search={search} />
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

      <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                Authentification active
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
                Le socle est pret. On peut maintenant avancer feature par feature.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                Cette page sert de cockpit apres login. Les modules sources, schemas et uploads sont volontairement
                prepares comme zones de sprint, sans logique metier branchee pour l’instant.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                  <Plus className="size-4" />
                  Demarrer sprint sources
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted">
                  Voir le backlog
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/35 p-4">
              <p className="text-sm font-medium">Parcours MVP</p>
              <div className="mt-4 space-y-3">
                {['Auth', 'Sources', 'Schemas', 'Uploads', 'Erreurs'].map((item, index) => (
                  <div className="flex items-center gap-3" key={item}>
                    <div className="grid size-8 place-items-center rounded-full bg-background text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: index === 0 ? '100%' : '18%' }}
                        />
                      </div>
                    </div>
                    {index === 0 ? (
                      <CheckCircle2 className="size-4 text-primary" />
                    ) : (
                      <Clock3 className="size-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ShieldCheck} label="Auth" value="OK" detail="JWT + refresh token" />
        <MetricCard icon={Database} label="Sources" value="0" detail="Sprint suivant" />
        <MetricCard icon={Layers3} label="Schemas" value="0" detail="Non branche" />
        <MetricCard icon={Activity} label="Uploads" value="0" detail="Polling a venir" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Sprints fonctionnels</h2>
              <p className="mt-1 text-sm text-muted-foreground">Modules prepares, implementation progressive.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {sprintCards.map((card) => {
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

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Etat du workspace</h2>
          <div className="mt-5 space-y-4">
            <StatusLine label="Session utilisateur" state="Connectee" done />
            <StatusLine label="Client Axios" state="Configure" done />
            <StatusLine label="Store local" state="Persiste" done />
            <StatusLine label="Features metier" state="Backlog" />
          </div>
        </div>
      </section>
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

function StatusLine({ label, state, done = false }: { label: string; state: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
      <span className="text-sm">{label}</span>
      <span className={done ? 'text-sm font-medium text-primary' : 'text-sm text-muted-foreground'}>{state}</span>
    </div>
  );
}
