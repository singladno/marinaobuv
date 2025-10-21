import * as React from 'react';

import { useSizeManagement } from '@/hooks/useSizeManagement';
import { useSizeMouseHandling } from '@/hooks/useSizeMouseHandling';
import type { Draft } from '@/types/admin';

import { ReadOnlySizesDisplay } from './ReadOnlySizesDisplay';
import { SizeActionButton } from './SizeActionButton';
import { SizeDisplay } from './SizeDisplay';
import { SizeEditMode } from './SizeEditMode';

interface SizesCellProps {
  sizes: Draft['sizes'];
  onChange?: (next: Draft['sizes']) => Promise<void> | void;
}

export function SizesCell({ sizes, onChange }: SizesCellProps) {
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

  const { hoveredIndex, setHoveredIndex, sizeRefs, setSizeRef } =
    useSizeMouseHandling();

  if (!onChange) {
    return <ReadOnlySizesDisplay sizes={sizes} />;
  }

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto overflow-y-visible py-2">
        {sizes?.map((x, index) => {
          const isEditing = editingIndex === index;
          const isSaving = savingIndex === index;
          if (!isEditing) {
            return (
              <SizeDisplay
                key={index}
                size={x}
                index={index}
                isSaving={isSaving}
                onEdit={() => (!isSaving ? startEdit(index) : undefined)}
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
              draftPairs={Number(draftPairs) || 0}
              setDraftPairs={(pairs: number) => setDraftPairs(String(pairs))}
              onKeyDown={handleKeyDown}
              onApply={() => applyEdit(index)}
              onCancel={() => setEditingIndex(null)}
              isSaving={savingIndex !== null}
            />
          );
        })}
        {onChange !== undefined && (
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

      {hoveredIndex !== null &&
        sizeRefs.current[hoveredIndex] &&
        onChange !== undefined && (
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
