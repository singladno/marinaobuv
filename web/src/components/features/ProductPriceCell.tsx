import { useState } from 'react';
import { flushSync } from 'react-dom';

import type { Product, ProductUpdateData } from '@/types/product';

import { EditableProductCell } from './EditableProductCell';

interface ProductPriceCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  priceInKopecks?: number;
}

export function ProductPriceCell({
  product,
  onUpdateProduct,
  priceInKopecks,
}: ProductPriceCellProps) {
  // Always show edit control
  const [isEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);

  const formatPricePlain = (price: number | string | null | undefined) => {
    const n = Number(price);
    if (isNaN(n)) return '';
    return String(Math.round(n));
  };

  const currentValue =
    optimisticValue ??
    formatPricePlain(priceInKopecks ?? (product as any).pricePair);

  const handleSave = (value: string) => {
    const digitsOnly = value.replace(/\D+/g, '');
    const numericValue = parseInt(digitsOnly, 10);

    if (isNaN(numericValue)) {
      return;
    }

    const stringValue = String(numericValue);

    // Don't update if already showing this value and not saving
    if (optimisticValue === stringValue && !isSaving) {
      return;
    }

    // CRITICAL: Set state IMMEDIATELY and flush synchronously to ensure UI updates
    flushSync(() => {
      setOptimisticValue(stringValue);
      setIsSaving(true);
    });

    // Defer async request to next tick so UI updates immediately
    Promise.resolve().then(() => {
      onUpdateProduct(product.id, { pricePair: numericValue })
        .then(() => {
          // Success - keep optimistic value
        })
        .catch(error => {
          console.error(
            '[ProductPriceCell] Error updating product price:',
            error
          );
          // Revert on error
          setOptimisticValue(null);
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
      step="1"
      className="text-sm font-medium text-gray-900"
    />
  );
}
