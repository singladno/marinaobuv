'use client';

import { useSidebarToggle } from '@/hooks/useSidebarToggle';

import AdminSidebar from './AdminSidebar';
import { SidebarToggle } from './SidebarToggle';
import AdminBottomNavigation from './AdminBottomNavigation';

type AdminSidebarLayoutProps = {
  children: React.ReactNode;
  userRole?: string;
};

export default function AdminSidebarLayout({
  children,
  userRole,
}: AdminSidebarLayoutProps) {
  const { isCollapsed, isMobileOpen, toggleMobile, closeMobile, setCollapsed } =
    useSidebarToggle();

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
        userRole={userRole}
      />

      {/* Main content area - Right column */}
      <div
        className="flex flex-1 flex-col overflow-y-auto bg-gray-50 transition-all duration-300 ease-in-out dark:bg-gray-900"
        style={
          {
            '--sidebar-width': isCollapsed ? '80px' : '224px',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties
        }
      >
        {/* Mobile header removed - using bottom navigation only */}

        {/* Main content - Allow scrolling; add bottom padding for mobile bottom nav */}
        <main className="flex-1 p-4 pb-20 sm:p-6 sm:pb-20 lg:pb-6">{children}</main>
        {/* Spacer for bottom navigation on mobile and tablet */}
        <div className="h-16 lg:hidden" />
        <AdminBottomNavigation userRole={userRole} />
      </div>
    </>
  );
}
// Sidebar links and chrome are handled in AdminSidebar.
