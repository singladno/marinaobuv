'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type AdminSidebarLogoutProps = {
  isCollapsed: boolean;
};

export function AdminSidebarLogout({ isCollapsed }: AdminSidebarLogoutProps) {
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
  );
}
