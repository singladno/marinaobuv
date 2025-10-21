import type { Product } from '@/types/product';

interface ProductProviderCellProps {
  product: Product;
}

export function ProductProviderCell({ product }: ProductProviderCellProps) {
  if (!product.provider) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <div className="min-w-0">
      <div className="truncate">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {product.provider.name}
        </div>
        {product.provider.phone && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {product.provider.phone}
          </div>
        )}
        {product.provider.place && (
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            📍 {product.provider.place}
          </div>
        )}
      </div>
    </div>
  );
}
