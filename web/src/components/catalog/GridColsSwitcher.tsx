'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import * as React from 'react';

type GridCols = 4 | 5;

type GridColsSwitcherProps = {
  value: GridCols;
  onChange?: (cols: GridCols) => void;
  className?: string;
};

export function GridColsSwitcher({
  value,
  onChange,
  className,
}: GridColsSwitcherProps) {
  return (
    <div className={cn('flex items-center rounded-md border', className)}>
      <Button
        variant={value === 4 ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => {
          console.log('Switching to 4 columns');
          if (onChange) onChange(4);
        }}
        aria-label="4 в ряд"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill={value === 4 ? 'currentColor' : '#9CA3AF'}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0 12.727c0-1.004.814-1.818 1.818-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 7.273 20H1.818A1.818 1.818 0 0 1 0 18.182v-5.455Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636ZM0 1.818C0 .814.814 0 1.818 0h5.455C8.277 0 9.09.814 9.09 1.818v5.455A1.818 1.818 0 0 1 7.273 9.09H1.818A1.818 1.818 0 0 1 0 7.273V1.818Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91V2.728a.91.91 0 0 1 .91-.909h3.636ZM12.727 0a1.818 1.818 0 0 0-1.818 1.818v5.455c0 1.004.814 1.818 1.818 1.818h5.455A1.818 1.818 0 0 0 20 7.273V1.818A1.818 1.818 0 0 0 18.182 0h-5.455Zm5.455 2.727a.91.91 0 0 0-.91-.909h-3.636a.91.91 0 0 0-.909.91v3.636c0 .502.407.909.91.909h3.636a.91.91 0 0 0 .909-.91V2.728ZM10.91 12.727c0-1.004.813-1.818 1.817-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 18.182 20h-5.455a1.818 1.818 0 0 1-1.818-1.818v-5.455Zm6.363 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909h-3.636a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636Z"
          />
        </svg>
      </Button>
      <Button
        variant={value === 5 ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => {
          console.log('Switching to 5 columns');
          if (onChange) onChange(5);
        }}
        aria-label="5 в ряд"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill={value === 5 ? 'currentColor' : '#9CA3AF'}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4h-2.2ZM15 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-4ZM15.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4h-2.2ZM15 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-4ZM15.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4h-2.2ZM15 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4ZM8.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H8.9ZM8 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H8ZM1.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H1.9ZM1 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H1ZM1.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H1.9ZM1 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1ZM8.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H8.9ZM8 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8ZM8.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H8.9ZM8 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H8ZM1.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H1.9ZM1 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1Z"
          />
        </svg>
      </Button>
    </div>
  );
}

export default GridColsSwitcher;
