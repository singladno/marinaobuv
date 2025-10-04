import * as React from 'react';
import { useCategories } from '@/hooks/useCategories';
import type { Product, ProductUpdateData } from '@/types/product';

import { CategorySelector } from '@/components/ui/CategorySelector';
import type { CategoryNode } from '@/components/ui/CategorySelector';

interface ProductCategoryCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

export function ProductCategoryCell({
  product,
  onUpdateProduct,
}: ProductCategoryCellProps) {
  const { categories } = useCategories();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleCategoryChange = async (categoryId: string | null) => {
    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, {
        categoryId: categoryId || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <CategorySelector
        value={product.categoryId}
        onChange={handleCategoryChange}
        categories={categories as CategoryNode[]}
        placeholder="Выберите категорию"
        disabled={isSaving}
      />
      {isSaving && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      )}
    </div>
  );
}
