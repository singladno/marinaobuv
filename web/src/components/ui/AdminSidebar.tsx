'use client';

import { AdminSidebarHeader } from './AdminSidebarHeader';
import { AdminSidebarLogout } from './AdminSidebarLogout';
import { AdminSidebarNavigation } from './AdminSidebarNavigation';

type AdminSidebarProps = {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean | ((v: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean | ((v: boolean) => boolean)) => void;
};

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: AdminSidebarProps) {
  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
        />
      )}
      <aside
        className={`flex h-full flex-col overflow-y-auto overflow-x-visible bg-white transition-all duration-300 ease-in-out dark:bg-gray-900 ${
          isCollapsed ? 'w-20 px-2' : 'w-56 px-3'
        } fixed inset-y-0 left-0 z-50 -translate-x-full py-8 md:relative md:translate-x-0`}
        data-state={isMobileOpen ? 'open' : 'closed'}
      >
        <div
          className={`h-full w-full transform transition-transform duration-300 ease-in-out ${
            isMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
          }`}
        >
          <AdminSidebarHeader
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />

          <div className="mt-6 flex flex-1 flex-col justify-between">
            <AdminSidebarNavigation isCollapsed={isCollapsed} />
            <AdminSidebarLogout isCollapsed={isCollapsed} />
          </div>
        </div>
      </aside>
    </>
  );
}
