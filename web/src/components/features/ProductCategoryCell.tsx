import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductCategoryCellProps {
  product: Product;
  categories: Array<{ id: string; name: string }>;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductCategoryCell({
  product,
  categories,
  onUpdateProduct,
}: ProductCategoryCellProps) {
  return (
    <EditableProductCell
      value={product.category.name}
      onSave={value => {
        const category = categories.find(c => c.name === value);
        if (category) onUpdateProduct(product.id, { categoryId: category.id });
      }}
      type="select"
      options={categories.map(c => ({ value: c.name, label: c.name }))}
    />
  );
}
