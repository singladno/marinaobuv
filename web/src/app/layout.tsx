// MarinaObuv Project - Component Size Limit: 120 lines max
// Decompose large components into hooks, sub-components, and utilities
import type { Metadata, Viewport } from 'next';

import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
import { AdminSwitcher } from '@/components/ui/AdminSwitcher';
// import Footer from '@/components/ui/Footer';
// import Header from '@/components/ui/Header';
import { defaultMetadata } from '@/lib/seo';

// Fonts: using system defaults to avoid build-time font fetch errors

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-background text-foreground min-h-screen antialiased">
        {/* Background Pattern (light/dark optimized) */}
        <div className="pointer-events-none absolute inset-0">
          {/* Light mode subtle grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(156,146,172,0.12)_1px,transparent_0)] bg-[length:20px_20px] opacity-25 dark:opacity-0"></div>
          {/* Dark mode subtle grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[length:20px_20px] opacity-0 dark:opacity-20"></div>
        </div>

        <div className="relative min-h-screen">
          <ClientProviders>
            {children}
            <AdminSwitcher />
          </ClientProviders>
        </div>
      </body>
    </html>
  );
}
