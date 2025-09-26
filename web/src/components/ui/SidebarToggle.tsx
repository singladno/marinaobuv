'use client';

import { cn } from '@/lib/utils';

interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function SidebarToggle({
  isCollapsed,
  onToggle,
  className,
}: SidebarToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className={cn(
        'group relative inline-flex h-9 w-9 items-center justify-center rounded-md',
        'transition-all duration-200 ease-in-out',
        'hover:scale-105 hover:bg-gray-100',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'dark:hover:bg-gray-800',
        'active:scale-95',
        className
      )}
      title={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`}
    >
      <svg
        className={cn(
          'h-5 w-5 transition-all duration-200 ease-in-out',
          'group-hover:scale-110',
          isCollapsed ? 'rotate-180' : 'rotate-0'
        )}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 18L15 12L9 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
