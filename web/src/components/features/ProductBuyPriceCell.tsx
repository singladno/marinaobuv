import { useState } from 'react';
import { flushSync } from 'react-dom';

import { EditableProductCell } from './EditableProductCell';
import type { Product, ProductUpdateData } from '@/types/product';

interface ProductBuyPriceCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

export function ProductBuyPriceCell({
  product,
  onUpdateProduct,
}: ProductBuyPriceCellProps) {
  const [isEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '';
    return String(Math.round(price * 100) / 100);
  };

  const currentValue = optimisticValue ?? formatPrice((product as any).buyPrice);

  const handleSave = (value: string) => {
    // Don't update if already showing this value and not saving
    if (optimisticValue === value && !isSaving) {
      return;
    }

    const previousValue = currentValue;

    // CRITICAL: Set state IMMEDIATELY and flush synchronously to ensure UI updates
    flushSync(() => {
      setOptimisticValue(value);
      setIsSaving(true);
    });

    const numericValue = value === '' ? null : parseFloat(value);

    // Defer async request to next tick so UI updates immediately
    Promise.resolve().then(() => {
      const updatePromise = numericValue !== null && !isNaN(numericValue)
        ? onUpdateProduct(product.id, { buyPrice: numericValue })
        : onUpdateProduct(product.id, { buyPrice: null });

      updatePromise
        .then(() => {
          // Success - keep optimistic value
        })
        .catch((error) => {
          console.error('[ProductBuyPriceCell] Error updating product buy price:', error);
          // Revert on error
          setOptimisticValue(previousValue);
        })
        .finally(() => {
          setIsSaving(false);
        });
    });
  };

  return (
    <EditableProductCell
      value={currentValue}
      onSave={handleSave}
      isEditing={isEditing}
      isSaving={isSaving}
      type="number"
      step="0.01"
      className="text-sm font-medium text-gray-900 dark:text-white"
    />
  );
}
