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
        'group relative inline-flex cursor-pointer items-center justify-center rounded-lg',
        'transition-all duration-300 ease-in-out',
        'hover:scale-105 hover:bg-gray-100 hover:shadow-md',
        'focus:outline-none',
        'dark:hover:bg-gray-800',
        'active:scale-95',
        'bg-white dark:bg-gray-800',
        'shadow-sm',
        className || 'h-9 w-9'
      )}
      title={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`}
    >
      <svg
        className={cn(
          'transition-all duration-300 ease-in-out',
          'group-hover:scale-110',
          isCollapsed ? 'rotate-0' : 'rotate-180',
          'h-4 w-4'
        )}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 18L15 12L9 6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
