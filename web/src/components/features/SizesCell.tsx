import * as React from 'react';

import { useSizeManagement } from '@/hooks/useSizeManagement';
import type { Draft } from '@/types/admin';

import { SizeActionButton } from './SizeActionButton';
import { SizeDisplay } from './SizeDisplay';
import { SizeEditMode } from './SizeEditMode';

interface SizesCellProps {
  sizes: Draft['sizes'];
  onChange?: (next: Draft['sizes']) => Promise<void> | void;
}

export function SizesCell({ sizes, onChange }: SizesCellProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const sizeRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  const {
    editingIndex,
    setEditingIndex,
    draftSize,
    setDraftSize,
    draftPairs,
    setDraftPairs,
    savingIndex,
    startEdit,
    applyEdit,
    deleteItem,
    addNew,
    handleKeyDown,
  } = useSizeManagement(sizes, onChange);

  const setSizeRef = React.useCallback((index: number) => {
    return (el: HTMLDivElement | null) => {
      sizeRefs.current[index] = el;
    };
  }, []);

  const hideTimeoutRef = React.useRef<number | null>(null);

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
              <SizeDisplay
                key={index}
                size={x}
                index={index}
                isSaving={isSaving}
                onEdit={() => {
                  if (onChange && !isSaving) startEdit(index);
                }}
                onDelete={() => deleteItem(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                sizeRef={setSizeRef(index)}
              />
            );
          }

          return (
            <SizeEditMode
              key={index}
              draftSize={draftSize}
              setDraftSize={setDraftSize}
              draftPairs={draftPairs}
              setDraftPairs={setDraftPairs}
              onKeyDown={handleKeyDown}
              onApply={() => applyEdit(index)}
              onCancel={() => setEditingIndex(null)}
              isSaving={savingIndex !== null}
            />
          );
        })}
        {onChange && (
          <button
            type="button"
            className="ml-1 flex-shrink-0 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-200"
            onClick={addNew}
            disabled={savingIndex !== null}
            aria-label="Добавить размер"
          >
            {savingIndex !== null ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-blue-700" />
            ) : (
              '+'
            )}
          </button>
        )}
      </div>

      {hoveredIndex !== null && sizeRefs.current[hoveredIndex] && onChange && (
        <SizeActionButton
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
