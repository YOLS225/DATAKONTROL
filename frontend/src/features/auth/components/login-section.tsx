'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Layers3,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authService } from '@/features/auth/api/auth-service';
import {
  authFormSchema,
  type AuthFormData,
} from '@/features/auth/schemas/auth-schema';
import { cn } from '@/shared/lib/utils';
import { useUserStore } from '@/shared/stores/user-store';

export function LoginSection() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { session, setSession } = useUserStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    setError,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [router, session]);

  const authMutation = useMutation({
    mutationFn: async (data: AuthFormData) => {
      if (mode === 'register') {
        const name = data.name?.trim();

        if (!name) {
          throw new Error('Le nom est requis');
        }

        await authService.register({
          name,
          email: data.email,
          password: data.password,
        });
        return { mode: 'register' as const };
      }

      return {
        mode: 'login' as const,
        session: (await authService.login({ email: data.email, password: data.password })).data,
      };
    },
    onSuccess: (result) => {
      reset();

      if (result.mode === 'register') {
        setMode('login');
        toast.success('Compte cree. Tu peux maintenant te connecter.');
        return;
      }

      setSession(result.session);
      toast.success('Session ouverte');
      router.replace('/dashboard');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Authentification impossible');
    },
  });

  const submitAuth = (data: AuthFormData) => {
    if (mode === 'register' && !data.name?.trim()) {
      setError('name', { message: 'Le nom est requis' });
      return;
    }

    authMutation.mutate(data);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,oklch(0.9759_0.0029_264.54),oklch(0.92_0.035_194),oklch(0.86_0.05_205))] text-foreground dark:bg-[linear-gradient(135deg,oklch(0.148_0.02_264),oklch(0.19_0.035_210),oklch(0.12_0.025_245))]">
      <header className="fixed inset-x-0 top-0 z-10 border-b bg-background/82 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">DATAKONTROL</p>
              <p className="text-xs text-muted-foreground">Controle et validation de donnees</p>
            </div>
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
      </header>

      <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-5 pb-8 pt-28 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:px-8">
        <div
          className="relative flex min-h-[620px] flex-col justify-between overflow-hidden rounded-lg border bg-card bg-cover bg-center text-white shadow-sm"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgb(10 20 28 / 0.90), rgb(10 20 28 / 0.68) 52%, rgb(10 20 28 / 0.38)), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=85')",
          }}
        >
          <div className="p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-sm text-white/82 backdrop-blur">
              <ShieldCheck className="size-4 text-primary" />
              Plateforme MVP de controle data
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Valide tes fichiers avec des schemas clairs.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/78">
              DATAKONTROL centralise les sources, les versions de schemas et les validations de fichiers pour garder
              une chaine de controle lisible.
            </p>
          </div>

          <div className="border-y border-white/14 bg-black/18 px-6 py-5 backdrop-blur md:px-8">
            <div className="grid gap-3 md:grid-cols-3">
              <FeatureItem icon={Database} label="Sources" text="Referentiel des donnees a controler" />
              <FeatureItem icon={Layers3} label="Schemas" text="Colonnes attendues et version active" />
              <FeatureItem icon={CheckCircle2} label="Validation" text="Traitement asynchrone des uploads" />
            </div>
          </div>

          <div className="grid gap-px bg-white/14 md:grid-cols-3">
            <StatBlock label="Auth" value="JWT" />
            <StatBlock label="Cache" value="Query" />
            <StatBlock label="UI" value="shadcn" />
          </div>
        </div>

        <aside className="rounded-lg border bg-card/92 p-5 text-card-foreground shadow-sm backdrop-blur md:p-6 dark:bg-card/88">
          <div>
            <p className="text-sm text-muted-foreground">Acces securise</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {mode === 'login' ? 'Connecte-toi' : 'Cree ton compte'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Retrouve ton workspace et continue le controle des donnees.'
                : 'Demarre avec une session utilisateur persistante.'}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 rounded-md border bg-muted p-1">
            <button
              className={cn(
                'rounded px-3 py-2 text-sm font-medium transition',
                mode === 'login' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setMode('login')}
              type="button"
            >
              Connexion
            </button>
            <button
              className={cn(
                'rounded px-3 py-2 text-sm font-medium transition',
                mode === 'register' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setMode('register')}
              type="button"
            >
              Inscription
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(submitAuth)}>
            {mode === 'register' && (
              <Field error={errors.name?.message} icon={<User className="size-4" />} label="Nom">
                <input
                  className="dk-input pl-10"
                  placeholder="Ex: Awa Kouame"
                  {...register('name')}
                />
              </Field>
            )}

            <Field error={errors.email?.message} icon={<Mail className="size-4" />} label="Email">
              <input
                className="dk-input pl-10"
                placeholder="Ex: awa@example.com"
                type="email"
                {...register('email')}
              />
            </Field>

            <Field error={errors.password?.message} icon={<Lock className="size-4" />} label="Mot de passe">
              <input
                className="dk-input pl-10"
                placeholder="Saisis ton mot de passe"
                type="password"
                {...register('password')}
              />
            </Field>

            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={authMutation.isPending}
              type="submit"
            >
              {authMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              {mode === 'login' ? 'Se connecter' : 'Creer le compte'}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </label>
  );
}

function FeatureItem({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof Database;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-white/16 bg-white/12 p-4 backdrop-blur">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs leading-5 text-white/72">{text}</p>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/16 p-5 backdrop-blur">
      <p className="text-xs uppercase text-white/62">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
