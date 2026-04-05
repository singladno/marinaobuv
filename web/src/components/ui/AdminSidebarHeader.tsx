'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { useUser } from '@/contexts/NextAuthUserContext';
import { getRoleLabel } from '@/app/admin/users/utils';

import { SidebarToggle } from './SidebarToggle';

type AdminSidebarHeaderProps = {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean | ((v: boolean) => boolean)) => void;
};

export function AdminSidebarHeader({
  isCollapsed,
  setIsCollapsed,
}: AdminSidebarHeaderProps) {
  const { user, loading } = useUser();
  const { status: sessionStatus } = useSession();
  const showUserSkeleton = loading || sessionStatus === 'loading';

  const userName = user?.name || user?.email || 'Пользователь';
  const userRole = user?.role ? getRoleLabel(user.role) : 'Админ';

  return (
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
          <div
            className="ml-3 flex min-w-0 flex-1 flex-col gap-1.5"
            aria-busy={showUserSkeleton}
            aria-label={showUserSkeleton ? 'Загрузка профиля' : undefined}
          >
            {showUserSkeleton ? (
              <>
                <div
                  className="h-4 max-w-[11rem] animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"
                  aria-hidden
                />
                <div
                  className="h-3 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-600"
                  aria-hidden
                />
              </>
            ) : (
              <>
                <span className="text-sm font-semibold leading-tight text-gray-800 dark:text-white">
                  {userName}
                </span>
                <span className="text-xs leading-tight text-gray-500 dark:text-gray-400">
                  {userRole}
                </span>
              </>
            )}
          </div>
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
  );
}
