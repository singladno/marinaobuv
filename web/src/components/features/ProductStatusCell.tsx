import { useState, useEffect } from 'react';

import type { Product, ProductUpdateData } from '@/types/product';

import { StatusSelect } from '@/components/features/StatusSelect';

interface ProductStatusCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

export function ProductStatusCell({
  product,
  onUpdateProduct,
}: ProductStatusCellProps) {
  // No visual indicators during requests

  const statusOptions = [
    { value: 'active', label: 'Активный' },
    { value: 'inactive', label: 'Неактивный' },
  ];
  const getStatusLabel = (isActive: boolean) => (isActive ? 'Активный' : 'Неактивный');

  const [displayValue, setDisplayValue] = useState<string>(getStatusLabel(product.isActive));

  useEffect(() => {
    setDisplayValue(getStatusLabel(product.isActive));
  }, [product.isActive]);

  const handleChange = async (nextLabel: string) => {
    // Optimistic value update without indicators
    setDisplayValue(nextLabel);
    try {
      const isActive = nextLabel === 'Активный';
      await onUpdateProduct(product.id, { isActive });
    } catch (e) {
      // Revert on error
      setDisplayValue(getStatusLabel(product.isActive));
    }
  };

  return (
    <StatusSelect
      value={displayValue}
      options={statusOptions}
      onChange={val => handleChange(val)}
      aria-label="Статус товара"
      className="text-sm"
    />
  );
}
