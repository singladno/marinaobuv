import { useState } from 'react';

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

  const formatPricePlain = (price: number | string | null | undefined) => {
    const n = Number(price);
    if (isNaN(n)) return '';
    return String(Math.round(n));
  };

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      // Accept only integer values; strip all non-digits
      const digitsOnly = value.replace(/\D+/g, '');
      const numericValue = parseInt(digitsOnly, 10);
      if (!isNaN(numericValue)) {
        await onUpdateProduct(product.id, { pricePair: numericValue });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditableProductCell
      value={formatPricePlain(priceInKopecks ?? (product as any).pricePair)}
      onSave={handleSave}
      isEditing={isEditing}
      isSaving={isSaving}
      type="number"
      step="1"
      className="text-sm font-medium text-gray-900"
    />
  );
}
