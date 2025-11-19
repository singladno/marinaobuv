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

  const initialIds = React.useMemo(() => (product.categoryId ? [product.categoryId] : []), [product.categoryId]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>(initialIds);

  // Keep selectedIds in sync with product
  React.useEffect(() => {
    setSelectedIds(product.categoryId ? [product.categoryId] : []);
  }, [product.categoryId]);

  const categoryOptions = React.useMemo(() => {
    const flat = flattenCategoryTree(categories);
    return flat.map(c => ({ id: c.id, label: c.label, level: c.level }));
  }, [categories]);

  const handleCategoryChange = async (categoryIds: string[]) => {
    // Optimistic update without indicators
    setSelectedIds(categoryIds);
    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, {
        categoryId: categoryIds.length > 0 ? categoryIds[0] : undefined,
      });
    } catch (e) {
      // Revert on error
      setSelectedIds(product.categoryId ? [product.categoryId] : []);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <CategoryControl
        value={selectedIds}
        onChange={handleCategoryChange}
        options={categoryOptions}
        tree={categories}
        label=""
        disabled={isSaving}
        selectLeavesOnly
      />
    </div>
  );
}
