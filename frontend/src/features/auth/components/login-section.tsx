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

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export function LoginSection() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { session, setSession } = useUserStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    setError,
    setValue,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      resetToken: '',
    },
  });

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [router, session]);

  const authMutation = useMutation({
    mutationFn: async (data: AuthFormData) => {
      if (mode === 'forgot') {
        return {
          mode: 'forgot' as const,
          response: (await authService.forgotPassword({ email: data.email ?? '' })).data,
        };
      }

      if (mode === 'reset') {
        const resetToken = data.resetToken?.trim();

        if (!resetToken) {
          throw new Error('Le token de reset est requis');
        }

        await authService.resetPassword({
          resetToken,
          password: data.password ?? '',
        });

        return { mode: 'reset' as const };
      }

      if (mode === 'register') {
        const name = data.name?.trim();

        if (!name) {
          throw new Error('Le nom est requis');
        }

        await authService.register({
          name,
          email: data.email ?? '',
          password: data.password ?? '',
        });
        return { mode: 'register' as const };
      }

      return {
        mode: 'login' as const,
        session: (await authService.login({ email: data.email ?? '', password: data.password ?? '' })).data,
      };
    },
    onSuccess: (result) => {
      reset();

      if (result.mode === 'register') {
        setMode('login');
        toast.success('Compte cree');
        return;
      }

      if (result.mode === 'forgot') {
        const resetToken = result.response.resetToken ?? '';

        toast.success('Demande envoyee');

        if (resetToken) {
          setValue('resetToken', resetToken);
          setMode('reset');
          return;
        }

        setMode('login');
        return;
      }

      if (result.mode === 'reset') {
        setMode('login');
        toast.success('Mot de passe reinitialise');
        return;
      }

      setSession(result.session);
      toast.success('Connecte');
      router.replace('/dashboard');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Authentification impossible');
    },
  });

  const submitAuth = (data: AuthFormData) => {
    if (mode !== 'reset' && !data.email?.trim()) {
      setError('email', { message: "L'email est requis" });
      return;
    }

    if (mode !== 'forgot' && !data.password?.trim()) {
      setError('password', { message: 'Le mot de passe est requis' });
      return;
    }

    if (mode === 'register' && !data.name?.trim()) {
      setError('name', { message: 'Le nom est requis' });
      return;
    }

    if (mode === 'reset' && !data.resetToken?.trim()) {
      setError('resetToken', { message: 'Le token de reset est requis' });
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
          className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden rounded-lg border bg-card bg-cover bg-center text-white shadow-sm lg:flex"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgb(10 20 28 / 0.88), rgb(10 20 28 / 0.64) 54%, rgb(10 20 28 / 0.32)), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=85')",
          }}
        >
          <div className="p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-sm text-white/82 backdrop-blur">
              <ShieldCheck className="size-4 text-primary" />
              Controle de donnees
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight">
              Valide tes fichiers avec des schemas clairs.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/78">
              Centralise tes sources, publie les versions de schemas et suis les erreurs de validation au meme endroit.
            </p>
          </div>

          <div className="border-y border-white/14 bg-black/18 px-8 py-5 backdrop-blur">
            <div className="grid gap-3 md:grid-cols-3">
              <FeatureItem icon={Database} label="Sources" text="Organiser les fichiers a controler" />
              <FeatureItem icon={Layers3} label="Schemas" text="Definir les colonnes attendues" />
              <FeatureItem icon={CheckCircle2} label="Validation" text="Voir les erreurs apres traitement" />
            </div>
          </div>
        </div>

        <aside className="w-full rounded-lg border bg-card p-5 text-card-foreground shadow-sm md:p-6">
          <div>
            <p className="text-sm text-muted-foreground">Acces securise</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {getAuthTitle(mode)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {getAuthDescription(mode)}
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

            {mode !== 'reset' && (
              <Field error={errors.email?.message} icon={<Mail className="size-4" />} label="Email">
                <input
                  className="dk-input pl-10"
                  placeholder="Ex: awa@example.com"
                  type="email"
                  {...register('email')}
                />
              </Field>
            )}

            {mode === 'reset' && (
              <input type="hidden" {...register('resetToken')} />
            )}

            {mode !== 'forgot' && (
              <Field error={errors.password?.message} icon={<Lock className="size-4" />} label="Mot de passe">
                <input
                  className="dk-input pl-10"
                  placeholder={mode === 'reset' ? 'Nouveau mot de passe' : 'Saisis ton mot de passe'}
                  type="password"
                  {...register('password')}
                />
              </Field>
            )}

            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={authMutation.isPending}
              type="submit"
            >
              {authMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              {getSubmitLabel(mode)}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            {mode === 'login' ? (
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setMode('forgot')} type="button">
                Mot de passe oublie
              </button>
            ) : (
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setMode('login')} type="button">
                Retour connexion
              </button>
            )}
          </div>
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

function getAuthTitle(mode: AuthMode) {
  if (mode === 'register') {
    return 'Cree ton compte';
  }

  if (mode === 'forgot') {
    return 'Reset password';
  }

  if (mode === 'reset') {
    return 'Nouveau mot de passe';
  }

  return 'Connecte-toi';
}

function getAuthDescription(mode: AuthMode) {
  if (mode === 'register') {
    return 'Demarre avec une session utilisateur persistante.';
  }

  if (mode === 'forgot') {
    return 'Indique ton email pour recevoir les instructions.';
  }

  if (mode === 'reset') {
    return 'Choisis un nouveau mot de passe.';
  }

  return 'Retrouve ton workspace et continue le controle des donnees.';
}

function getSubmitLabel(mode: AuthMode) {
  if (mode === 'register') {
    return 'Creer le compte';
  }

  if (mode === 'forgot') {
    return 'Demander le reset';
  }

  if (mode === 'reset') {
    return 'Reinitialiser';
  }

  return 'Se connecter';
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
