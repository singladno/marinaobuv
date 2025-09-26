'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarToggle } from './SidebarToggle';

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
        className={`flex h-full flex-col overflow-y-auto bg-white transition-all duration-300 ease-in-out dark:bg-gray-900 ${
          isCollapsed ? 'w-20 px-2' : 'w-56 px-3'
        } fixed inset-y-0 left-0 z-50 -translate-x-full py-8 md:relative md:translate-x-0`}
        style={{ overflowX: 'visible' }}
        data-state={isMobileOpen ? 'open' : 'closed'}
      >
        <div
          className={`h-full w-full transform transition-transform duration-300 ease-in-out ${
            isMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Header with Logo and Toggle */}
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {!isCollapsed && (
                <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-white">
                  Админ
                </span>
              )}
            </Link>

            {/* Toggle Button - Always visible */}
            <div className="relative z-10 -mr-3">
              <SidebarToggle
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
                className={isCollapsed ? 'h-8 w-8' : ''}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex flex-1 flex-col justify-between">
            <nav>
              <AdminSidebarLink
                href="/admin"
                label="Главная"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                collapsed={isCollapsed}
              />

              <AdminSidebarLink
                href="/admin/drafts"
                label="Черновики"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12h6M9 16h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                collapsed={isCollapsed}
              />

              <AdminSidebarLink
                href="/admin/products"
                label="Товары"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                collapsed={isCollapsed}
              />

              <AdminSidebarLink
                href="/admin/orders"
                label="Заказы"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                collapsed={isCollapsed}
              />

              <AdminSidebarLink
                href="/admin/users"
                label="Пользователи"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                collapsed={isCollapsed}
              />
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}

function AdminSidebarLink({
  href,
  label,
  icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`group relative mt-3 flex transform items-center rounded-lg transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 ${
        collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
      } ${
        isActive
          ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/20 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400'
      }`}
      title={collapsed ? label : undefined}
    >
      <div
        className={`flex items-center justify-center ${collapsed ? 'h-6 w-6' : ''}`}
      >
        {icon}
      </div>
      {!collapsed && (
        <span className="ml-3 font-medium transition-opacity duration-300">
          {label}
        </span>
      )}
      {collapsed && <span className="sr-only">{label}</span>}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 hidden rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:block group-hover:opacity-100 dark:bg-gray-700">
          {label}
          <div className="absolute left-0 top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900 dark:bg-gray-700"></div>
        </div>
      )}
    </Link>
  );
}
