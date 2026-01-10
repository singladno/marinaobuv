import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

import type { DraftSize } from '@/types/admin';

import { OptimisticSizesCell } from './OptimisticSizesCell';
import { ProductSizesSummary } from './ProductSizesSummary';

interface ProductSizesCellProps {
  sizes: Array<{ size: string; count: number }> | null;
  onChange?: (
    next: Array<{ size: string; count: number }>
  ) => Promise<void> | void;
  disabled?: boolean;
  defaultCollapsed?: boolean;
  hideSummary?: boolean;
  measurementUnit?: 'PAIRS' | 'PIECES';
}

export function ProductSizesCell({
  sizes,
  onChange,
  disabled = false,
  defaultCollapsed = false,
  hideSummary = false,
  measurementUnit = 'PAIRS',
}: ProductSizesCellProps) {
  const hasSizes = sizes && sizes.length > 0;

  // All hooks must be called unconditionally at the top
  const [isEditing, setIsEditing] = React.useState(!hasSizes);
  const [shouldRenderEditor, setShouldRenderEditor] = React.useState(!hasSizes);
  const editPanelRef = React.useRef<HTMLDivElement | null>(null);

  const draftSizes: DraftSize[] = React.useMemo(
    () =>
      (sizes || []).map((sizeObj, index) => ({
        id: `size-${index}`,
        size: sizeObj.size,
        quantity: sizeObj.count,
        isActive: true,
      })),
    [sizes]
  );

  const handleChange = React.useCallback(
    async (nextDraftSizes: DraftSize[]) => {
      if (!onChange) return;

      const nextSizes: Array<{ size: string; count: number }> =
        nextDraftSizes.map(draftSize => ({
          size: draftSize.size,
          count: draftSize.quantity,
        }));

      await Promise.resolve().then(() => onChange(nextSizes));
    },
    [onChange]
  );

  const canEdit = Boolean(onChange) && !disabled;

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (isEditing) {
      setShouldRenderEditor(true);
    } else {
      timeoutId = setTimeout(() => {
        setShouldRenderEditor(false);
      }, 300);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isEditing]);

  React.useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: PointerEvent) => {
      if (!editPanelRef.current) return;
      if (editPanelRef.current.contains(event.target as Node)) return;
      setIsEditing(false);
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isEditing]);

  // If hideSummary is true (edit mode), always show editor open, no collapse functionality
  if (hideSummary) {
    return (
      <OptimisticSizesCell
        sizes={draftSizes}
        onChange={handleChange}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full">
      {!hideSummary && (
        <div className="w-full">
          <ProductSizesSummary
            sizes={sizes}
            canEdit={canEdit}
            isEditing={isEditing}
            onToggleEdit={() => setIsEditing(prev => !prev)}
            measurementUnit={measurementUnit}
          />
        </div>
      )}

      {hideSummary && !isEditing && canEdit && (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-gray-700 dark:text-gray-200 dark:hover:text-purple-300 cursor-pointer"
          title="Редактировать размеры"
        >
          <PencilSquareIcon className="h-4 w-4" />
        </button>
      )}

      <div
        ref={editPanelRef}
        className={`w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          isEditing
            ? 'max-h-[1200px] opacity-100'
            : 'max-h-0 opacity-0 shadow-none'
        }`}
      >
        <div className="p-4">
          {shouldRenderEditor && (
            <div className="space-y-2">
              {hideSummary && isEditing && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Редактировать размеры
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-gray-700 dark:text-gray-200 dark:hover:text-purple-300"
                    title="Скрыть"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              <OptimisticSizesCell
                sizes={draftSizes}
                onChange={handleChange}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
