'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

type Props = {
  value: [number, number];
  onChange: (value: [number, number]) => void;
};

export default function PriceControl({ value, onChange }: Props) {
  const [min, setMin] = useState<string>(String(value[0]));
  const [max, setMax] = useState<string>(String(value[1]));
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMin(String(value[0]));
    setMax(String(value[1]));
  }, [value]);

  const apply = () => {
    const parsed: [number, number] = [
      Math.max(0, Number(min) || 0),
      Math.max(0, Number(max) || 0),
    ];
    if (parsed[0] > parsed[1]) parsed[0] = parsed[1];
    onChange(parsed);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 rounded-xl bg-gray-50 text-gray-700 shadow-sm hover:bg-gray-100"
          onMouseEnter={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            setOpen(true);
          }}
          onMouseLeave={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            closeTimer.current = setTimeout(() => setOpen(false), 120);
          }}
        >
          Цена, ₽
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80"
        onMouseEnter={() => {
          if (closeTimer.current) clearTimeout(closeTimer.current);
          setOpen(true);
        }}
        onMouseLeave={() => {
          if (closeTimer.current) clearTimeout(closeTimer.current);
          closeTimer.current = setTimeout(() => setOpen(false), 120);
        }}
      >
        <div className="space-y-3 p-2">
          <div className="text-sm font-semibold">Диапазон цены</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={min}
              onChange={e => setMin(e.target.value)}
              placeholder="От"
              className="h-10 rounded-xl border-0 bg-gray-100 px-3 text-sm text-gray-900 outline-none ring-2 ring-transparent transition-shadow focus:bg-white focus:ring-blue-500/20"
            />
            <input
              type="number"
              inputMode="numeric"
              value={max}
              onChange={e => setMax(e.target.value)}
              placeholder="До"
              className="h-10 rounded-xl border-0 bg-gray-100 px-3 text-sm text-gray-900 outline-none ring-2 ring-transparent transition-shadow focus:bg-white focus:ring-blue-500/20"
            />
          </div>
          <Button
            onClick={apply}
            className="h-10 w-full rounded-xl bg-purple-600 text-white hover:bg-purple-600/90"
          >
            Готово
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
