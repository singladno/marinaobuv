// MarinaObuv Project - Component Size Limit: 120 lines max
// Decompose large components into hooks, sub-components, and utilities
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import Footer from '@/components/ui/Footer';
import Header from '@/components/ui/Header';
import { defaultMetadata } from '@/lib/seo';
import { AdminSwitcher } from '@/components/ui/AdminSwitcher';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-white"
        >
          Пропустить к содержимому
        </a>
        <div className="bg-background text-foreground flex h-dvh min-h-0 flex-col">
          <Header />
          <main className="min-h-0 flex-1 overflow-hidden">
            <div
              id="main-content"
              className="container mx-auto h-full min-h-0 px-4 py-6"
            >
              {children}
            </div>
          </main>
          <Footer />
          <AdminSwitcher />
        </div>
      </body>
    </html>
  );
}
