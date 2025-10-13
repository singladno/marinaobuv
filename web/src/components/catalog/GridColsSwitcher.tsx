'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

type GridCols = 4 | 5;

type GridColsSwitcherProps = {
  value: GridCols;
  onChange: (cols: GridCols) => void;
  className?: string;
};

export function GridColsSwitcher({
  value,
  onChange,
  className,
}: GridColsSwitcherProps) {
  const handleSet = (cols: GridCols) => () => onChange(cols);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        aria-label="4 columns"
        onClick={handleSet(4)}
        className={cn(
          'h-9 w-9 rounded-md border transition-colors',
          value === 4
            ? 'border-foreground text-foreground'
            : 'text-muted-foreground hover:border-muted border-transparent'
        )}
      >
        {/* 2x2 icon */}
        <div className="mx-auto grid h-5 w-5 grid-cols-2 gap-1">
          <span className="block rounded-sm border" />
          <span className="block rounded-sm border" />
          <span className="block rounded-sm border" />
          <span className="block rounded-sm border" />
        </div>
      </button>

      <button
        type="button"
        aria-label="5 columns"
        onClick={handleSet(5)}
        className={cn(
          'h-9 w-9 rounded-md border transition-colors',
          value === 5
            ? 'border-foreground text-foreground'
            : 'text-muted-foreground hover:border-muted border-transparent'
        )}
      >
        {/* 3x3 icon */}
        <div className="mx-auto grid h-5 w-5 grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="block rounded-[2px] border" />
          ))}
        </div>
      </button>
    </div>
  );
}

export default GridColsSwitcher;
