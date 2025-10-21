'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ParsingIndicator } from './ParsingIndicator';

type AdminSidebarLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
  isParsingActive?: boolean;
};

export function AdminSidebarLink({
  href,
  label,
  icon,
  collapsed,
  isParsingActive = false,
}: AdminSidebarLinkProps) {
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

      {/* Parsing indicator */}
      <ParsingIndicator isActive={isParsingActive} collapsed={collapsed} />

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
