'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

type Props = {
  label: string;
  badgeCount?: number;
  children: React.ReactNode;
  contentClassName?: string;
};

export default function FilterPill({
  label,
  badgeCount,
  children,
  contentClassName,
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
          className="group h-9 rounded-xl bg-gray-50 text-gray-700 shadow-sm hover:bg-gray-100"
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        >
          {label}
          {(badgeCount ?? 0) > 0 && (
            <Badge variant="secondary" className="ml-2">
              {badgeCount}
            </Badge>
          )}
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
        className={contentClassName}
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
