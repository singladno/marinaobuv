import * as React from 'react';

import { OptimisticSizesCell } from './OptimisticSizesCell';
import type { ProductSize } from '@/types/product';
import type { DraftSize } from '@/types/admin';

interface ProductSizesCellProps {
  sizes: ProductSize[];
  onChange?: (next: ProductSize[]) => Promise<void> | void;
}

export function ProductSizesCell({ sizes, onChange }: ProductSizesCellProps) {
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

  return <OptimisticSizesCell sizes={draftSizes} onChange={handleChange} />;
}
