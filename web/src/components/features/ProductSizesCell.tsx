import type { ProductSize } from '@/types/product';

interface ProductSizesCellProps {
  sizes: ProductSize[];
}

export function ProductSizesCell({ sizes }: ProductSizesCellProps) {
  if (sizes.length === 0) {
    return (
      <div className="text-sm">
        <span className="text-gray-400">-</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {sizes.map((size, index) => (
        <div
          key={size.id}
          className="inline-flex flex-col items-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        >
          <span className="font-semibold">{size.size}</span>
          {size.stock !== null && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {size.stock} шт
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
