'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  label?: string;
};

export default function CategoryControl({
  value,
  onChange,
  options,
  label = 'Категория',
}: Props) {
  const count = value.length;
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

  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter(v => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 rounded-xl bg-gray-50 text-gray-700 shadow-sm hover:bg-gray-100"
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        >
          {label}
          {count > 0 && (
            <Badge variant="secondary" className="ml-2">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-2"
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
      >
        <div className="max-h-80 overflow-auto">
          {options.map(option => (
            <button
              key={option}
              onClick={() => toggle(option)}
              className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                value.includes(option) ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
