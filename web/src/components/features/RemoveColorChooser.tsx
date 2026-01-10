'use client';
import { useMemo } from 'react';

import ColorIndicator from '@/components/product/ColorIndicator';

type Item = { id: string; color?: string | null };

type Props = {
  items: Item[];
  onChoose: (itemId: string) => void;
  onCancel: () => void;
};

export default function RemoveColorChooser({
  items,
  onChoose,
  onCancel,
}: Props) {
  const unique = useMemo(() => {
    const seen = new Set<string>();
    return items.filter(i => {
      const key = (i.color ?? 'unknown').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [items]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity"
        onClick={onCancel}
      />
      <div className="relative z-50 w-56 origin-center rounded-lg bg-white p-3 shadow-lg ring-1 ring-black/5 transition-transform">
        <div className="mb-2 text-center text-sm font-medium text-gray-700">
          Какой цвет убрать из закупки?
        </div>
        <div className="flex items-center justify-center gap-3">
          {unique.map(item => {
            return (
              <button
                key={item.id + (item.color ?? '')}
                type="button"
                className="group flex cursor-pointer flex-col items-center gap-1 focus:outline-none"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChoose(item.id);
                }}
              >
                <span className="hover:ring-foreground/10 border-muted inline-flex h-6 w-6 items-center justify-center rounded-full border transition-shadow transition-transform duration-150 hover:scale-105 hover:ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
                  <ColorIndicator colorName={item.color} size="md" />
                </span>
                <span className="text-[10px] text-gray-500 transition-colors duration-150 group-hover:text-gray-700">
                  {item.color ?? 'Цвет'}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
