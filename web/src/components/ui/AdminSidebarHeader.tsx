'use client';

import Link from 'next/link';

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
  const { user } = useUser();
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
          <div className="ml-3 flex flex-col">
            <span className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
              {userName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              {userRole}
            </span>
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
