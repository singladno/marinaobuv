import * as React from 'react';
import { flushSync } from 'react-dom';
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
    const previousIds = selectedIds;
    // Optimistic update - flush immediately to ensure UI updates
    flushSync(() => {
      setSelectedIds(categoryIds);
      setIsSaving(true);
    });
    try {
      await onUpdateProduct(product.id, {
        categoryId: categoryIds.length > 0 ? categoryIds[0] : undefined,
      });
      // Success - keep optimistic value
    } catch (e) {
      console.error('Error updating product category:', e);
      // Revert on error
      setSelectedIds(previousIds);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <CategoryControl
          value={selectedIds}
          onChange={handleCategoryChange}
          options={categoryOptions}
          tree={categories}
          label=""
          disabled={isSaving}
          selectLeavesOnly
        />
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
