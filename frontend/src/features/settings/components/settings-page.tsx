'use client';

import {
  FileText,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { useUserStore } from '@/shared/stores/user-store';

const themeOptions = [
  { label: 'Systeme', value: 'system' },
  { label: 'Clair', value: 'light' },
  { label: 'Sombre', value: 'dark' },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const session = useUserStore((state) => state.session);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Parametres</p>
            <h1 className="text-2xl font-semibold">Preferences du workspace</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            DATAKONTROL
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SettingsCard
          description="Informations visibles dans ton espace de travail."
          icon={User}
          title="Profil"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <ReadonlyField label="Nom" value={session?.user.name ?? '-'} />
            <ReadonlyField label="Email" value={session?.user.email ?? '-'} />
          </div>
        </SettingsCard>

        <SettingsCard
          description="Choisis le confort visuel de l'application."
          icon={Palette}
          title="Apparence"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const isActive = theme === option.value;

              return (
                <button
                  className={cn(
                    'flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium transition hover:bg-muted',
                    isActive && 'border-primary bg-primary/10 text-primary'
                  )}
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  type="button"
                >
                  {option.value === 'dark' ? (
                    <Moon className="size-4" />
                  ) : option.value === 'light' ? (
                    <Sun className="size-4" />
                  ) : (
                    <Palette className="size-4" />
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>
        </SettingsCard>

        <SettingsCard
          description="Preferences d'affichage utilisees dans les tableaux et les rapports."
          icon={FileText}
          title="Affichage des donnees"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <PreferenceLine label="Pagination par defaut" value="5 lignes" />
            <PreferenceLine label="Recherche" value="Appliquee apres saisie" />
            <PreferenceLine label="Dates" value="Format francais" />
            <PreferenceLine label="Rapports" value="Erreurs groupees par upload" />
          </div>
        </SettingsCard>
      </section>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex min-h-10 items-center rounded-md border bg-muted/35 px-3 text-sm">
        <span className="min-w-0 truncate text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

function PreferenceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{value}</p>
    </div>
  );
}
