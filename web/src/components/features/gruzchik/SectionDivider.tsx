'use client';

import { cn } from '@/lib/utils';

interface SectionDividerProps {
  className?: string;
  variant?: 'default' | 'subtle' | 'bold';
}

export function SectionDivider({
  className,
  variant = 'default',
}: SectionDividerProps) {
  const variants = {
    default: 'border-gray-200',
    subtle: 'border-gray-100',
    bold: 'border-gray-300',
  };

  return (
    <div className={cn('relative my-6', className)}>
      {/* Main divider line */}
      <div className={cn('h-px w-full border-t', variants[variant])}></div>

      {/* Decorative elements */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform items-center space-x-2">
        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
}
