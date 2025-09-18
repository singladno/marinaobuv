import * as React from 'react';
import { createPortal } from 'react-dom';

import type { Draft } from '@/types/admin';

interface SizesCellProps {
  sizes: Draft['sizes'];
  onChange?: (next: Draft['sizes']) => Promise<void> | void;
}

export function SizesCell({ sizes, onChange }: SizesCellProps) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [draftSize, setDraftSize] = React.useState<string>('');
  const [draftPairs, setDraftPairs] = React.useState<string>('');
  const [savingIndex, setSavingIndex] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const sizeRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const [pendingEditIndex, setPendingEditIndex] = React.useState<number | null>(
    null
  );

  const setSizeRef = React.useCallback((index: number) => {
    return (el: HTMLDivElement | null) => {
      sizeRefs.current[index] = el;
    };
  }, []);

  const hideTimeoutRef = React.useRef<number | null>(null);

  // Handle pending edit after sizes change
  React.useEffect(() => {
    if (pendingEditIndex !== null && sizes && sizes.length > pendingEditIndex) {
      const item = sizes[pendingEditIndex];
      if (item && item.size === '' && (item.stock === 0 || item.count === 0)) {
        setEditingIndex(pendingEditIndex);
        setPendingEditIndex(null);
      }
    }
  }, [sizes, pendingEditIndex]);

  React.useEffect(() => {
    if (hoveredIndex === null) return;
    const handleMove = (e: MouseEvent) => {
      const el = sizeRefs.current[hoveredIndex!];
      if (!el) {
        setHoveredIndex(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const bufferX = 12;
      const bufferBelow = 6;
      const bufferAbove = 36; // cover floating action zone
      const within =
        e.clientX >= r.left - bufferX &&
        e.clientX <= r.right + bufferX &&
        e.clientY >= r.top - bufferAbove &&
        e.clientY <= r.bottom + bufferBelow;

      if (within) {
        if (hideTimeoutRef.current) {
          window.clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        return;
      }

      if (!hideTimeoutRef.current) {
        hideTimeoutRef.current = window.setTimeout(() => {
          setHoveredIndex(null);
          hideTimeoutRef.current = null;
        }, 120);
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [hoveredIndex]);

  const startEdit = (index: number) => {
    if (!sizes || !sizes[index]) return;
    const current = sizes[index];
    setDraftSize(current.size ?? '');
    const pairs =
      typeof current.stock === 'number'
        ? String(current.stock)
        : typeof current.count === 'number'
          ? String(current.count)
          : '0';
    setDraftPairs(pairs);
    setEditingIndex(index);
  };

  const applyEdit = async (index: number) => {
    if (!onChange) return setEditingIndex(null);
    const next = (sizes ? [...sizes] : []) as NonNullable<Draft['sizes']>;
    const current = next[index];
    if (!current) return setEditingIndex(null);

    const numericPairs = Number.isFinite(Number(draftPairs))
      ? Math.max(0, Math.floor(Number(draftPairs)))
      : 0;

    const useCount = current.count !== undefined && current.stock === undefined;
    const updated = {
      size: draftSize.trim(),
      stock: useCount ? undefined : numericPairs,
      count: useCount ? numericPairs : undefined,
    };

    next[index] = updated;
    try {
      setSavingIndex(index);
      await Promise.resolve(onChange(next));
      setEditingIndex(null);
    } finally {
      setSavingIndex(null);
    }
  };

  const deleteItem = async (index: number) => {
    if (!onChange) return;
    const next = (sizes ? [...sizes] : []) as NonNullable<Draft['sizes']>;
    next.splice(index, 1);
    try {
      setSavingIndex(index);
      await Promise.resolve(onChange(next.length ? next : null));
      if (editingIndex === index) setEditingIndex(null);
    } finally {
      setSavingIndex(null);
    }
  };

  const addNew = () => {
    if (!onChange) return;
    const next = (sizes ? [...sizes] : []) as NonNullable<Draft['sizes']>;
    const newItem = { size: '', stock: 0 };
    next.push(newItem);

    const idx = next.length - 1;
    setDraftSize('');
    setDraftPairs('0');
    setPendingEditIndex(idx);

    // Call onChange after setting the editing state
    onChange(next);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (editingIndex === null) return;
    if (e.key === 'Enter') applyEdit(editingIndex);
    if (e.key === 'Escape') setEditingIndex(null);
  };

  if (!sizes || sizes.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 dark:text-gray-500">—</span>
        {onChange && (
          <button
            type="button"
            className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200"
            onClick={addNew}
            aria-label="Добавить размер"
          >
            +
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto overflow-y-visible py-2">
        {sizes.map((x, index) => {
          const isEditing = editingIndex === index;
          const isSaving = savingIndex === index;
          if (!isEditing) {
            return (
              <div
                key={index}
                ref={setSizeRef(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  if (onChange && !isSaving) startEdit(index);
                }}
                className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                title={onChange ? 'Нажмите, чтобы редактировать' : undefined}
              >
                {isSaving ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700 dark:border-gray-400 dark:border-t-gray-200" />
                  </span>
                ) : (
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {x.size}
                    </span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-300">
                      {x.stock ?? x.count ?? 0}
                    </span>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={index}
              className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-yellow-50 px-2 py-1 text-xs text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100"
            >
              <input
                value={draftSize}
                onChange={e => setDraftSize(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={savingIndex !== null}
                className="h-6 w-16 rounded border border-yellow-300 bg-white px-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:border-yellow-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Размер"
                aria-label="Размер"
              />
              <input
                value={draftPairs}
                onChange={e => setDraftPairs(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={savingIndex !== null}
                className="h-6 w-12 rounded border border-yellow-300 bg-white px-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:border-yellow-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Пары"
                aria-label="Пары"
                inputMode="numeric"
              />
              <button
                type="button"
                className="rounded px-1 text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/20"
                onClick={() => applyEdit(index)}
                disabled={savingIndex !== null}
                aria-label="Сохранить"
                title="Сохранить"
              >
                ✓
              </button>
              <button
                type="button"
                className="rounded px-1 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
                onClick={() => setEditingIndex(null)}
                disabled={savingIndex !== null}
                aria-label="Отменить"
                title="Отменить"
              >
                ↩
              </button>
            </div>
          );
        })}
        {onChange && (
          <button
            type="button"
            className="ml-1 flex-shrink-0 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200"
            onClick={addNew}
            aria-label="Добавить размер"
          >
            +
          </button>
        )}
      </div>

      {hoveredIndex !== null && sizeRefs.current[hoveredIndex] && onChange && (
        <SizeActionButton
          index={hoveredIndex}
          isSaving={savingIndex === hoveredIndex}
          onDelete={() => deleteItem(hoveredIndex)}
          onMouseEnter={() => setHoveredIndex(hoveredIndex)}
          onMouseLeave={() => setHoveredIndex(null)}
          sizeRef={sizeRefs.current[hoveredIndex]}
        />
      )}
    </>
  );
}

interface SizeActionButtonProps {
  index: number;
  isSaving: boolean;
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  sizeRef: HTMLDivElement | null;
}

function SizeActionButton({
  index,
  isSaving,
  onDelete,
  onMouseEnter,
  onMouseLeave,
  sizeRef,
}: SizeActionButtonProps) {
  if (!sizeRef || typeof document === 'undefined') {
    return null;
  }

  const rect = sizeRef.getBoundingClientRect();

  return createPortal(
    <div
      className="fixed z-50 flex gap-1"
      // Dynamic positioning requires inline styles
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        left: `${rect.left + rect.width / 2 - 10}px`,
        top: `${rect.top - 14}px`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={e => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={isSaving}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600 disabled:opacity-50"
        title="Удалить размер"
      >
        {isSaving ? (
          <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <svg
            className="h-2.5 w-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )}
      </button>
    </div>,
    document.body
  );
}
