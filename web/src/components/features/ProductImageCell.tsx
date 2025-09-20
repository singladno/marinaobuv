import type { Product } from '@/types/product';

interface ProductImageCellProps {
  product: Product;
}

export function ProductImageCell({ product }: ProductImageCellProps) {
  return (
    <div className="flex items-center">
      {product.images[0] ? (
        <img
          src={product.images[0].url}
          alt={product.images[0].alt || product.name}
          className="h-12 w-12 rounded object-cover"
        />
      ) : (
        <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
      )}
    </div>
  );
}
