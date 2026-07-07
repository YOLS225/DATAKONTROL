import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppProviders } from '@/providers/app-providers';
import '../styles/globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'DATAKONTROL',
  description: 'Plateforme de validation et de contrôle de données',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={poppins.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
