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
      <body className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 antialiased dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(156,146,172,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        </div>

        <div className="relative min-h-screen">
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
