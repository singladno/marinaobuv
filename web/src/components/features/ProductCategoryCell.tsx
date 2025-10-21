import * as React from 'react';
import type { Product, ProductUpdateData } from '@/types/product';
import type { CategoryNode } from '@/components/ui/CategorySelector';

import CategoryControl from '@/components/product/filters/CategoryControl';
import { flattenCategoryTree } from '@/utils/categoryUtils';

interface ProductCategoryCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  categories: CategoryNode[];
}

export function ProductCategoryCell({
  product,
  onUpdateProduct,
  categories,
}: ProductCategoryCellProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const categoryOptions = React.useMemo(() => {
    const flat = flattenCategoryTree(categories);
    return flat.map(c => ({ id: c.id, label: c.label, level: c.level }));
  }, [categories]);

  const handleCategoryChange = async (categoryIds: string[]) => {
    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, {
        categoryId: categoryIds.length > 0 ? categoryIds[0] : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <CategoryControl
        value={product.categoryId ? [product.categoryId] : []}
        onChange={handleCategoryChange}
        options={categoryOptions}
        tree={categories}
        label=""
        disabled={isSaving}
      />
      {isSaving && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      )}
    </div>
  );
}
