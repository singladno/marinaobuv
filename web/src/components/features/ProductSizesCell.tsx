import type { ProductSize } from '@/types/product';

interface ProductSizesCellProps {
  sizes: ProductSize[];
}

export function ProductSizesCell({ sizes }: ProductSizesCellProps) {
  return (
    <div className="text-sm">
      {sizes.length > 0 ? (
        <span className="text-gray-600 dark:text-gray-400">
          {sizes.length} размеров
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      )}
    </div>
  );
}
