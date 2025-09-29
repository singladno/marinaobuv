// MarinaObuv Project - Component Size Limit: 120 lines max
// Decompose large components into hooks, sub-components, and utilities
import type { Metadata, Viewport } from 'next';

import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
// import { AdminSwitcher } from '@/components/ui/AdminSwitcher';
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
      <body className={`antialiased`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
