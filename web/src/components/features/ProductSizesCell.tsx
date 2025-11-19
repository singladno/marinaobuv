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
}

export function ProductSizesCell({
  sizes,
  onChange,
  disabled = false,
}: ProductSizesCellProps) {
  const hasSizes = sizes && sizes.length > 0;
  // Auto-open editor when there are no sizes (create mode)
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

  return (
    <div className="space-y-2">
      <ProductSizesSummary
        sizes={sizes}
        canEdit={canEdit}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(prev => !prev)}
      />

      <div
        ref={editPanelRef}
        className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          isEditing
            ? 'max-h-[1200px] opacity-100'
            : 'max-h-0 opacity-0 shadow-none'
        }`}
      >
        <div className="p-4">
          {shouldRenderEditor && (
            <OptimisticSizesCell
              sizes={draftSizes}
              onChange={handleChange}
              disabled={disabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
