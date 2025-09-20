import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductArticleCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductArticleCell({
  product,
  onUpdateProduct,
}: ProductArticleCellProps) {
  return (
    <EditableProductCell
      value={product.article || ''}
      onSave={value => onUpdateProduct(product.id, { article: value || null })}
      type="text"
    />
  );
}
