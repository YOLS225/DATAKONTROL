import type { ReactNode } from 'react';
import { ProtectedShell } from '@/features/auth/components/protected-shell';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
