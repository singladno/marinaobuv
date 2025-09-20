import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductNameCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductNameCell({
  product,
  onUpdateProduct,
}: ProductNameCellProps) {
  return (
    <EditableProductCell
      value={product.name}
      onSave={value => onUpdateProduct(product.id, { name: value })}
      type="text"
      className="font-medium"
    />
  );
}
