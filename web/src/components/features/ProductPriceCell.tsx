import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductPriceCellProps {
  product: Product;
  priceInKopecks: number;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductPriceCell({
  product,
  priceInKopecks,
  onUpdateProduct,
}: ProductPriceCellProps) {
  const formattedPrice = (priceInKopecks / 100).toFixed(2);

  return (
    <EditableProductCell
      value={formattedPrice}
      onSave={value =>
        onUpdateProduct(product.id, { pricePair: parseFloat(value) * 100 })
      }
      type="number"
      step="0.01"
    />
  );
}
