'use client';

import { Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { MainContent } from '@/shared/components/widget/card-content/main-content';
import SidebarContent from '@/shared/components/widget/sidebar/sidebarContent';
import { cn } from '@/shared/lib/utils';

type LayoutProps = {
  header?: ReactNode;
  children: ReactNode;
  isLoggingOut?: boolean;
  onLogout?: () => void;
};

export default function Layout({ header, children, isLoggingOut, onLogout }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="lg:hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <p className="text-base font-semibold">DATAKONTROL</p>
          <button
            className="grid size-10 place-items-center rounded-md border bg-card"
            onClick={() => setIsOpen((value) => !value)}
            type="button"
          >
            <Menu className="size-5" />
          </button>
        </div>
        <div
          className={cn(
            'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition lg:hidden',
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={() => setIsOpen(false)}
        />
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-80 max-w-[86vw] transition lg:hidden',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent isLoggingOut={isLoggingOut} onLogout={onLogout} />
        </div>
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <SidebarContent isLoggingOut={isLoggingOut} onLogout={onLogout} />
      </div>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <MainContent header={header}>{children}</MainContent>
      </div>
    </div>
  );
}
