import * as React from 'react';

import type { DraftSize } from '@/types/admin';
import type { ProductSize } from '@/types/product';

import { OptimisticSizesCell } from './OptimisticSizesCell';

interface ProductSizesCellProps {
  sizes: ProductSize[];
  onChange?: (next: ProductSize[]) => Promise<void> | void;
  disabled?: boolean;
}

export function ProductSizesCell({
  sizes,
  onChange,
  disabled = false,
}: ProductSizesCellProps) {
  // Convert ProductSize[] to DraftSize[] format
  const draftSizes: DraftSize[] = sizes.map(size => ({
    id: size.id,
    size: size.size,
    quantity: size.stock ?? 0,
    isActive: true,
  }));

  const handleChange = React.useCallback(
    async (nextDraftSizes: DraftSize[]) => {
      if (!onChange) return;

      // Convert back to ProductSize[] format
      const nextProductSizes: ProductSize[] = nextDraftSizes.map(draftSize => ({
        id: draftSize.id,
        size: draftSize.size,
        stock: draftSize.quantity,
        sku: null,
      }));

      await onChange(nextProductSizes);
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
