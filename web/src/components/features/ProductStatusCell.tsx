import { useState } from 'react';

import type { Product, ProductUpdateData } from '@/types/product';

import { EditableProductCell } from './EditableProductCell';

interface ProductStatusCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

export function ProductStatusCell({
  product,
  onUpdateProduct,
}: ProductStatusCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const statusOptions = [
    { value: 'active', label: 'Активный' },
    { value: 'inactive', label: 'Неактивный' },
    { value: 'draft', label: 'Черновик' },
  ];

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      const selectedOption = statusOptions.find(opt => opt.label === value);
      if (selectedOption) {
        await onUpdateProduct(product.id, {
          isActive: selectedOption.value === 'active',
        });
      }
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  return (
    <EditableProductCell
      value={getStatusLabel(product.isActive ? 'active' : 'inactive')}
      onSave={handleSave}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      isSaving={isSaving}
      type="select"
      options={statusOptions}
      className="text-sm"
    />
  );
}
