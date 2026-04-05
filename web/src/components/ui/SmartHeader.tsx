'use client';

import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SmartHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Tablet/desktop: fixed below the admin sidebar. Mobile: stays in normal flow.
 * Uses CSS (`md:`) only — no `useEffect` width check — so the first paint matches
 * after hydration and avoids a vertical jump when paired with `md:pt-*` on content.
 */
export function SmartHeader({ children, className = '' }: SmartHeaderProps) {
  return (
    <div
      className={cn(
        'z-50 bg-white transition-all duration-300',
        'md:fixed md:top-0 md:shadow-sm',
        'md:left-[var(--sidebar-width,224px)] md:right-0',
        'md:w-[calc(100vw-var(--sidebar-width,224px))]',
        className
      )}
    >
      {children}
    </div>
  );
}
