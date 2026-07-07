import type { ReactNode } from 'react';

export interface MainContentProps {
  header?: ReactNode;
  children: ReactNode;
}

export function MainContent({ header, children }: MainContentProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col bg-background">
      {header && <div className="border-b bg-background/90 px-5 py-4 backdrop-blur md:px-8">{header}</div>}
      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">{children}</div>
    </main>
  );
}
