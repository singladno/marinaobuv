'use client';

import Link from 'next/link';

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
        className={
          `bg-surface/70 border-r backdrop-blur-sm transition-all duration-200 ease-in-out ` +
          (isCollapsed ? 'md:w-16' : 'md:w-60') +
          ' fixed inset-y-0 left-0 z-50 w-60 -translate-x-full md:static md:translate-x-0'
        }
        data-state={isMobileOpen ? 'open' : 'closed'}
      >
        <div
          className={
            `h-full w-full transform transition-transform duration-200 ease-in-out ` +
            (isMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0')
          }
        >
          <div className="flex items-center justify-between px-2 py-2">
            <button
              type="button"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-controls="admin-sidebar-nav"
              onClick={() => setIsCollapsed((v: boolean) => !v)}
              className="hidden h-9 w-9 items-center justify-center rounded-md transition hover:bg-[color-mix(in_oklab,var(--color-background),#000_6%)] focus:outline-none focus:ring-2 focus:ring-blue-600 md:inline-flex"
            >
              <span className="sr-only">Toggle sidebar</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {!isCollapsed && (
              <div className="px-2 text-sm font-medium">Админ</div>
            )}
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setIsMobileOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-[color-mix(in_oklab,var(--color-background),#000_6%)] focus:outline-none focus:ring-2 focus:ring-blue-600 md:hidden"
            >
              <span className="sr-only">Close sidebar</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav id="admin-sidebar-nav" className="space-y-1 px-2 pb-3 text-sm">
            <AdminSidebarLink
              href="/admin"
              label="Главная"
              collapsed={isCollapsed}
            />
            <AdminSidebarLink
              href="/admin/drafts"
              label="Черновики"
              collapsed={isCollapsed}
            />
            <AdminSidebarLink
              href="/admin/products"
              label="Товары"
              collapsed={isCollapsed}
            />
          </nav>
        </div>
      </aside>
    </>
  );
}

function AdminSidebarLink({
  href,
  label,
  collapsed,
}: {
  href: string;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      className="flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-[color-mix(in_oklab,var(--color-background),#000_4%)]"
      href={href}
    >
      <div className="bg-foreground/60 h-1.5 w-1.5 rounded-full" />
      {!collapsed && <span>{label}</span>}
      {collapsed && <span className="sr-only">{label}</span>}
    </Link>
  );
}
