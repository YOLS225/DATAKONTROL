'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Database,
  FileText,
  Layers3,
  LogOut,
  Settings,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useUserStore } from '@/shared/stores/user-store';
import { cn } from '@/shared/lib/utils';

type SidebarContentProps = {
  activeItem?: string;
  isLoggingOut?: boolean;
  onLogout?: () => void;
};

const navigation = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: BarChart3, enabled: true },
  { id: 'sources', label: 'Sources', href: '/sources', icon: Database, enabled: true },
  { id: 'schemas', label: 'Schemas', href: '/schemas', icon: Layers3, enabled: false },
  { id: 'uploads', label: 'Uploads', href: '/uploads', icon: UploadCloud, enabled: false },
  { id: 'reports', label: 'Rapports', href: '/reports', icon: FileText, enabled: false },
  { id: 'settings', label: 'Parametres', href: '/settings', icon: Settings, enabled: false },
];

export default function SidebarContent({
  activeItem,
  isLoggingOut = false,
  onLogout,
}: SidebarContentProps) {
  const pathname = usePathname();
  const session = useUserStore((state) => state.session);
  const initials = session?.user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex h-full w-full flex-col border-r bg-sidebar text-sidebar-foreground lg:w-72">
      <div className="border-b px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">DATAKONTROL</p>
            <p className="text-xs text-muted-foreground">Data quality workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || activeItem === item.id;
          const className = cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
            isActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            !item.enabled && 'cursor-not-allowed opacity-45'
          );
          const content = (
            <>
              <Icon className="size-4" />
              <span>{item.label}</span>
              {!item.enabled && <span className="ml-auto text-[10px] uppercase">bientot</span>}
            </>
          );

          if (item.enabled) {
            return (
              <Link className={className} href={item.href} key={item.id}>
                {content}
              </Link>
            );
          }

          return (
            <button
              className={className}
              disabled={!item.enabled}
              key={item.id}
              type="button"
            >
              {content}
            </button>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-card p-3 text-card-foreground">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{session?.user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.user.email}</p>
          </div>
        </div>
        <button
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium transition hover:bg-muted disabled:opacity-60"
          disabled={isLoggingOut}
          onClick={onLogout}
          type="button"
        >
          <LogOut className="size-4" />
          Se deconnecter
        </button>
      </div>
    </aside>
  );
}
