import type { Product, ProductUpdateData } from '@/types/product';

import { EditableProductCell } from './EditableProductCell';

interface ProductPriceCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

export function ProductPriceCell({
  product,
  onUpdateProduct,
}: ProductPriceCellProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(price);
  };

  return (
    <EditableProductCell
      value={formatPrice(product.pricePair)}
      onSave={async value => {
        const numericValue = parseFloat(
          value.replace(/[^\d.,]/g, '').replace(',', '.')
        );
        if (!isNaN(numericValue)) {
          await onUpdateProduct(product.id, { pricePair: numericValue });
        }
      }}
      type="text"
      className="text-sm font-medium text-gray-900"
    />
  );
}
