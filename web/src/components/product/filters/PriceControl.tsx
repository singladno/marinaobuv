'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';

import FilterPill from './FilterPill';

type Props = {
  value: [number, number];
  onChange: (value: [number, number]) => void;
};

export default function PriceControl({ value, onChange }: Props) {
  const [min, setMin] = useState<string>(String(value[0]));
  const [max, setMax] = useState<string>(String(value[1]));

  useEffect(() => {
    const nextMin = String(value[0]);
    const nextMax = String(value[1]);
    setMin(prev => (prev !== nextMin ? nextMin : prev));
    setMax(prev => (prev !== nextMax ? nextMax : prev));
  }, [value[0], value[1]]);

  const apply = () => {
    const parsed: [number, number] = [
      Math.max(0, Number(min) || 0),
      Math.max(0, Number(max) || 0),
    ];
    if (parsed[0] > parsed[1]) parsed[0] = parsed[1];
    onChange(parsed);
  };

  return (
    <FilterPill
      label="Цена, ₽"
      contentClassName="w-80"
      isActive={value[0] > 0 || value[1] < 100000}
      onClear={() => onChange([0, 100000])}
    >
      <div className="space-y-3 p-3">
        <div className="text-sm font-semibold">Диапазон цены</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={min}
            onChange={e => setMin(e.target.value)}
            placeholder="От"
            className="h-11 rounded-xl border border-transparent bg-gray-100 px-3 text-sm text-gray-900 outline-none ring-0 transition-shadow focus:border-purple-500 focus:bg-white"
          />
          <input
            type="number"
            inputMode="numeric"
            value={max}
            onChange={e => setMax(e.target.value)}
            placeholder="До"
            className="h-11 rounded-xl border border-transparent bg-gray-100 px-3 text-sm text-gray-900 outline-none ring-0 transition-shadow focus:border-purple-500 focus:bg-white"
          />
        </div>
        <Button
          onClick={apply}
          className="h-11 w-full rounded-xl bg-purple-600 text-white hover:bg-purple-600/90"
        >
          Готово
        </Button>
      </div>
    </FilterPill>
  );
}
