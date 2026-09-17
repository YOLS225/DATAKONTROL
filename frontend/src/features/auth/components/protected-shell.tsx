'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
import { authService } from '@/features/auth/api/auth-service';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import Layout from '@/shared/components/widget/layout/layout';
import { useUserStore } from '@/shared/stores/user-store';

export function ProtectedShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, resetUser } = useUserStore();

  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [router, session]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (session?.refreshToken) {
        await authService.logout({ refreshToken: session.refreshToken });
      }
    },
    onSettled: () => {
      resetUser();
      toast.success('Session fermee');
      router.replace('/');
    },
  });

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Redirection...
      </div>
    );
  }

  return (
    <Layout
      header={
        <div className="flex items-center justify-end">
          <NotificationBell />
        </div>
      }
      isLoggingOut={logoutMutation.isPending}
      onLogout={() => logoutMutation.mutate()}
    >
      {children}
    </Layout>
  );
}
