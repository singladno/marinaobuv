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

  return (
    <EditableProductCell
      value={category?.name || 'Без категории'}
      onSave={async value => {
        const selectedCategory = categories.find(cat => cat.name === value);
        if (selectedCategory) {
          await onUpdateProduct(product.id, {
            categoryId: selectedCategory.id,
          });
        }
      }}
      type="select"
      options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
      className="text-sm text-gray-900"
    />
  );
}
