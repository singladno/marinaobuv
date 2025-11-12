'use client';
import { useMemo, useRef, useState, useEffect } from 'react';

import { getColorHex } from '@/utils/colorMapping';

type PurchaseItem = {
  id: string;
  sortIndex: number;
  color?: string | null;
};

type Props = {
  items: PurchaseItem[];
  onSubmitIndex: (itemId: string, newIndex: number) => Promise<void>;
};

export default function PurchaseIndexBadges({ items, onSubmitIndex }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sortIndex - b.sortIndex),
    [items]
  );

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  if (sorted.length === 0) return null;

  return (
    <div className="absolute left-3 top-3 z-30 flex gap-1">
      {sorted.map(item => {
        const bg = item.color ? getColorHex(item.color) : '#8B5CF6';
        const isEditing = editingId === item.id;
        return (
          <div key={item.id} className="relative">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => {
                  const v = e.target.value;
                  if (v === '' || (/^\d+$/.test(v) && parseInt(v) > 0))
                    setValue(v);
                }}
                onBlur={async () => {
                  const num = parseInt(value);
                  if (!isNaN(num)) await onSubmitIndex(item.id, num);
                  setEditingId(null);
                  setValue('');
                }}
                onKeyDown={async e => {
                  if (e.key === 'Enter') {
                    const num = parseInt(value);
                    if (!isNaN(num)) await onSubmitIndex(item.id, num);
                    setEditingId(null);
                    setValue('');
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                    setValue('');
                  }
                }}
                className="h-6 w-8 rounded border border-purple-300 bg-white px-1 text-center text-xs font-bold text-purple-600 focus:border-purple-500 focus:outline-none"
                maxLength={3}
                aria-label="Порядковый номер в закупке"
                placeholder="№"
              />
            ) : (
              <button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingId(item.id);
                  setValue(String(item.sortIndex));
                }}
                className="inline-flex cursor-pointer items-center rounded-md px-2.5 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: bg }}
                title="Нажмите для изменения порядка"
              >
                {item.sortIndex}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
