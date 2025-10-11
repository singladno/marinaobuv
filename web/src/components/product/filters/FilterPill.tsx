'use client';

import { useRef, useState } from 'react';

// import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

type Props = {
  label: React.ReactNode;
  badgeCount?: number;
  children: React.ReactNode;
  contentClassName?: string;
  isActive?: boolean;
  onClear?: () => void;
  disabled?: boolean;
  displayName?: string; // For showing selected category name
};

export default function FilterPill({
  label,
  badgeCount,
  children,
  contentClassName,
  isActive = false,
  onClear,
  disabled = false,
  displayName,
}: Props) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`group h-9 min-w-32 rounded-xl shadow-sm hover:bg-gray-100 ${
            isActive
              ? 'border-purple-300 bg-purple-100 text-purple-700'
              : 'bg-gray-50 text-gray-700'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          onMouseEnter={disabled ? undefined : openNow}
          onMouseLeave={disabled ? undefined : scheduleClose}
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            {displayName ? (
              <>
                <span className="truncate">{displayName}</span>
                {onClear && (
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      onClear();
                    }}
                    className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-sm hover:bg-purple-200/60"
                    aria-label="Очистить"
                  >
                    ×
                  </span>
                )}
              </>
            ) : badgeCount && badgeCount > 0 ? (
              <>
                <span>
                  {label}: {badgeCount}
                </span>
                {onClear && (
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      onClear();
                    }}
                    className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-sm hover:bg-purple-200/60"
                    aria-label="Очистить"
                  >
                    ×
                  </span>
                )}
              </>
            ) : (
              <span>{label}</span>
            )}
          </span>
          <svg
            className={`ml-2 h-4 w-4 text-gray-400 transition-colors transition-transform duration-200 group-hover:rotate-180 group-hover:text-black ${open ? 'rotate-180 text-black' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={contentClassName}
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
