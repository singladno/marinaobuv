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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(price);
  };

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      const numericValue = parseFloat(
        value.replace(/[^\d.,]/g, '').replace(',', '.')
      );
      if (!isNaN(numericValue)) {
        await onUpdateProduct(product.id, { pricePair: numericValue });
      }
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  return (
    <EditableProductCell
      value={formatPrice(priceInKopecks ?? (product as any).pricePair)}
      onSave={handleSave}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      isSaving={isSaving}
      type="text"
      className="text-sm font-medium text-gray-900"
    />
  );
}
