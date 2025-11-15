import * as React from 'react';

import type { DraftSize } from '@/types/admin';

import { OptimisticSizesCell } from './OptimisticSizesCell';

interface ProductSizesCellProps {
  sizes: Array<{ size: string; count: number }> | null; // Array of size objects like [{size: '36', count: 1}, {size: '38', count: 2}] or null
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
  // Convert to DraftSize[] format - memoize to prevent unnecessary re-renders
  const draftSizes: DraftSize[] = React.useMemo(
    () =>
      (sizes || []).map((sizeObj, index) => ({
        id: `size-${index}`, // Generate temporary ID
        size: sizeObj.size,
        quantity: sizeObj.count,
        isActive: true,
      })),
    [sizes]
  );

  const handleChange = React.useCallback(
    async (nextDraftSizes: DraftSize[]) => {
      if (!onChange) return;

      // Convert back to size objects format
      const nextSizes: Array<{ size: string; count: number }> =
        nextDraftSizes.map(draftSize => ({
          size: draftSize.size,
          count: draftSize.quantity,
        }));

      // Defer the onChange call to avoid updating state during render
      await Promise.resolve().then(() => onChange(nextSizes));
    },
    [onChange]
  );

  return (
    <OptimisticSizesCell
      sizes={draftSizes}
      onChange={handleChange}
      disabled={disabled}
    />
  );
}
