'use client';

import { useSidebarToggle } from '@/hooks/useSidebarToggle';

import AdminSidebar from './AdminSidebar';
import { SidebarToggle } from './SidebarToggle';

type AdminSidebarLayoutProps = {
  children: React.ReactNode;
};

export default function AdminSidebarLayout({
  children,
}: AdminSidebarLayoutProps) {
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleMobile,
    closeMobile,
    setCollapsed,
  } = useSidebarToggle();

  return (
    <>
      {/* Sidebar - Left column */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={v =>
          setCollapsed(typeof v === 'function' ? v(isCollapsed) : v)
        }
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={closeMobile}
      />

      {/* Main content area - Right column */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50 transition-all duration-300 ease-in-out dark:bg-gray-900">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={toggleMobile}
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

          {/* Mobile Toggle Button */}
          <SidebarToggle isCollapsed={isCollapsed} onToggle={toggleCollapse} />
        </div>

        {/* Main content - Allow scrolling */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </>
  );
}
// Sidebar links and chrome are handled in AdminSidebar.
