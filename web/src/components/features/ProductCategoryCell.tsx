import * as React from 'react';
import { useCategories } from '@/hooks/useCategories';
import type { Product, ProductUpdateData } from '@/types/product';

import { EditableProductCell } from './EditableProductCell';

interface ProductCategoryCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

export function ProductCategoryCell({
  product,
  onUpdateProduct,
}: ProductCategoryCellProps) {
  const { categories } = useCategories();
  const category = categories.find(cat => cat.id === product.categoryId);

  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async (value: string) => {
    const selectedCategory = categories.find(cat => cat.name === value);
    if (!selectedCategory) return;
    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, { categoryId: selectedCategory.id });
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  return (
    <EditableProductCell
      value={category?.name || 'Без категории'}
      onSave={handleSave}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      isSaving={isSaving}
      type="select"
      options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
      className="text-sm text-gray-900"
    />
  );
}
