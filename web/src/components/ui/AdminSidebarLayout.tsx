'use client';

import { useEffect, useState } from 'react';

import AdminSidebar from './AdminSidebar';

type AdminSidebarLayoutProps = {
  children: React.ReactNode;
};

export default function AdminSidebarLayout({
  children,
}: AdminSidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('adminSidebarCollapsed');
      if (saved) setIsCollapsed(saved === '1');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('adminSidebarCollapsed', isCollapsed ? '1' : '0');
    } catch {}
  }, [isCollapsed]);

  return (
    <div className="flex h-full min-h-0 gap-6">
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <section className="min-w-0 flex-1 overflow-auto p-2 sm:p-4">
        <div className="mb-2 flex items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setIsMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-[color-mix(in_oklab,var(--color-background),#000_6%)] focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-foreground/70 text-sm">Меню</span>
        </div>
        {children}
      </section>
    </div>
  );
}
// Sidebar links and chrome are handled in AdminSidebar.
