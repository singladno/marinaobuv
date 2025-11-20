import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';

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
  const statusOptions = [
    { value: 'active', label: 'Активный' },
    { value: 'inactive', label: 'Неактивный' },
  ];
  const getStatusLabel = (isActive: boolean) => (isActive ? 'Активный' : 'Неактивный');

  const [displayValue, setDisplayValue] = useState<string>(getStatusLabel(product.isActive));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDisplayValue(getStatusLabel(product.isActive));
  }, [product.isActive]);

  const handleChange = async (nextLabel: string) => {
    // Optimistic update - flush immediately to ensure UI updates
    flushSync(() => {
      setDisplayValue(nextLabel);
      setIsSaving(true);
    });

    try {
      const isActive = nextLabel === 'Активный';
      await onUpdateProduct(product.id, { isActive });
      // Success - keep optimistic value
    } catch (e) {
      console.error('Error updating product status:', e);
      // Revert on error
      setDisplayValue(getStatusLabel(product.isActive));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StatusSelect
      value={displayValue}
      options={statusOptions}
      onChange={val => handleChange(val)}
      disabled={false}
      status={isSaving ? 'saving' : 'idle'}
      aria-label="Статус товара"
      className="text-sm"
    />
  );
}
