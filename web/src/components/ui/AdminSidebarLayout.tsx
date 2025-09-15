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
    <>
      {/* Sidebar - Left column */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main content area - Right column */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden dark:border-gray-700 dark:bg-gray-900">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setIsMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:hover:bg-gray-800"
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
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Меню
          </span>
        </div>

        {/* Main content - No scroll here */}
        <main className="flex-1 overflow-hidden p-4 sm:p-6">{children}</main>
      </div>
    </>
  );
}
// Sidebar links and chrome are handled in AdminSidebar.
