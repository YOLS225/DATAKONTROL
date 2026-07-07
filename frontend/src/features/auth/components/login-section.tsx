'use client';

import { Loader2, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '@/features/auth/api/auth-service';
import { cn } from '@/shared/lib/utils';
import { useUserStore, type UserSession } from '@/shared/stores/user-store';

export function LoginSection() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { session, setSession } = useUserStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
  };

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [router, session]);

  const authMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'register') {
        return (await authService.register({ name, email, password })).data;
      }

      return (await authService.login({ email, password })).data;
    },
    onSuccess: (authSession: UserSession) => {
      setSession(authSession);
      resetForm();
      toast.success('Session ouverte');
      router.replace('/dashboard');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Authentification impossible');
    },
  });

  const submitAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    authMutation.mutate();
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
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
      </header>

      <section className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="flex flex-col justify-between bg-primary px-6 py-10 text-primary-foreground md:px-10">
          <div className="max-w-3xl py-12 md:py-20">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
              MVP data quality
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Une entree claire pour controler tes donnees.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/78">
              On demarre par une authentification solide. Les sources, schemas et uploads arriveront ensuite sprint
              par sprint.
            </p>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <FeaturePill>Session JWT</FeaturePill>
            <FeaturePill>Refresh token</FeaturePill>
            <FeaturePill>Local storage aligne</FeaturePill>
          </div>
        </div>

        <aside className="flex items-center px-6 py-10">
          <div className="mx-auto w-full max-w-sm">
            <form className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm" onSubmit={submitAuth}>
              <p className="text-sm text-muted-foreground">Bienvenue</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {mode === 'login' ? 'Connexion' : 'Creation de compte'}
              </h2>

              <div className="mt-6 grid grid-cols-2 rounded-md border bg-muted p-1">
                <button
                  className={cn('rounded px-3 py-2 text-sm', mode === 'login' && 'bg-background shadow-sm')}
                  onClick={() => setMode('login')}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={cn('rounded px-3 py-2 text-sm', mode === 'register' && 'bg-background shadow-sm')}
                  onClick={() => setMode('register')}
                  type="button"
                >
                  Register
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {mode === 'register' && (
                  <Field label="Nom">
                    <input
                      className="dk-input"
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex: Yoann LASM"
                      required
                      value={name}
                    />
                  </Field>
                )}
                <Field label="Email">
                  <input
                    className="dk-input"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Ex: yoann@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </Field>
                <Field label="Mot de passe">
                  <input
                    className="dk-input"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Saisis ton mot de passe"
                    required
                    type="password"
                    value={password}
                  />
                </Field>
              </div>

              <button
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                disabled={authMutation.isPending}
                type="submit"
              >
                {authMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {mode === 'login' ? 'Se connecter' : 'Creer le compte'}
              </button>
            </form>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function FeaturePill({ children }: { children: ReactNode }) {
  return <div className="rounded-md bg-white/12 px-3 py-2 text-white/85">{children}</div>;
}
