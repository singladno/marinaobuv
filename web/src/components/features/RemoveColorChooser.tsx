'use client';
import { useMemo } from 'react';

type Item = { id: string; color?: string | null };

type Props = {
  items: Item[];
  onChoose: (itemId: string) => void;
  onCancel: () => void;
};

const colorMap: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  gray: '#9CA3AF',
  grey: '#9CA3AF',
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  orange: '#F97316',
  brown: '#92400E',
  beige: '#D2B48C',
  pink: '#EC4899',
  purple: '#8B5CF6',
  violet: '#8B5CF6',
  navy: '#1E3A8A',
  tan: '#D2B48C',
  чёрный: '#000000',
  черный: '#000000',
  белый: '#FFFFFF',
  серый: '#9CA3AF',
  красный: '#EF4444',
  синий: '#3B82F6',
  голубой: '#60A5FA',
  зелёный: '#10B981',
  зеленый: '#10B981',
  жёлтый: '#F59E0B',
  желтый: '#F59E0B',
  оранжевый: '#F97316',
  коричневый: '#92400E',
  бежевый: '#D2B48C',
  розовый: '#EC4899',
  фиолетовый: '#8B5CF6',
  бордовый: '#7F1D1D',
  хаки: '#8A9A5B',
  небесный: '#60A5FA',
  молочный: '#F8FAFC',
};

function resolveColor(name?: string | null) {
  if (!name) return '#D1D5DB';
  const n = name.trim().toLowerCase().replace(/[_]/g, ' ').replace(/\s+/g, ' ');
  return colorMap[n] || '#D1D5DB';
}

export default function RemoveColorChooser({ items, onChoose, onCancel }: Props) {
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity" onClick={onCancel} />
      <div className="relative z-50 w-56 origin-center rounded-lg bg-white p-3 shadow-lg ring-1 ring-black/5 transition-transform">
        <div className="mb-2 text-center text-sm font-medium text-gray-700">Какой цвет убрать из закупки?</div>
        <div className="flex items-center justify-center gap-3">
          {unique.map(item => {
            const bg = resolveColor(item.color);
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
                <span
                  className="hover:ring-foreground/10 inline-flex h-6 w-6 items-center justify-center rounded-full border transition-transform transition-shadow duration-150 hover:scale-105 hover:ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 border-muted"
                >
                  <span
                    aria-hidden
                    className="block h-4 w-4 rounded-full"
                    style={{ backgroundColor: bg }}
                  />
                </span>
                <span className="text-[10px] text-gray-500 transition-colors duration-150 group-hover:text-gray-700">
                  {(item.color ?? 'Цвет')}
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


