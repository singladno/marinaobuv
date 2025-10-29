'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { SidebarToggle } from './SidebarToggle';

type GruzchikSidebarProps = {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean | ((v: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean | ((v: boolean) => boolean)) => void;
};

export default function GruzchikSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: GruzchikSidebarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
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
          {/* Header with Logo and Toggle */}
          <div className="flex items-center justify-between">
            <Link href="/gruzchik" className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
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
                  Грузчик
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
              <GruzchikSidebarLink
                href="/gruzchik"
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

              <GruzchikSidebarLink
                href="/gruzchik/purchase"
                label="Закупка"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                collapsed={isCollapsed}
              />

              <GruzchikSidebarLink
                href="/gruzchik/availability"
                label="Наличие"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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

            {/* Logout Button */}
            <div className="mt-6">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`group relative mt-3 flex w-full transform items-center rounded-lg transition-all duration-300 hover:scale-105 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400 ${
                  isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                } text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400`}
                title={isCollapsed ? 'Выйти' : undefined}
              >
                <div
                  className={`flex items-center justify-center ${isCollapsed ? 'h-6 w-6' : ''}`}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {!isCollapsed && (
                  <span className="ml-3 font-medium transition-opacity duration-300">
                    {isLoggingOut ? 'Выходим...' : 'Выйти'}
                  </span>
                )}
                {isCollapsed && <span className="sr-only">Выйти</span>}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 hidden rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:block group-hover:opacity-100 dark:bg-gray-700">
                    Выйти
                    <div className="absolute left-0 top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900 dark:bg-gray-700"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function GruzchikSidebarLink({
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
      className={`group relative mt-3 flex transform cursor-pointer items-center rounded-lg transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 ${
        collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
      } ${
        isActive
          ? 'bg-orange-50 text-orange-700 shadow-sm dark:bg-orange-900/20 dark:text-orange-400'
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
