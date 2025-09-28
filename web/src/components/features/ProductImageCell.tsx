import Image from 'next/image';

import type { Product } from '@/types/product';

interface ProductImageCellProps {
  product: Product;
}

export function ProductImageCell({ product }: ProductImageCellProps) {
  const primaryImage =
    product.images?.find(img => img.isPrimary) || product.images?.[0];

  return (
    <div className="flex items-center space-x-3">
      <div className="h-12 w-12 flex-shrink-0">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
            <span className="text-xs text-gray-500">Нет фото</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-gray-900">
          {product.name}
        </div>
        <div className="truncate text-xs text-gray-500">{product.article}</div>
      </div>
    </div>
  );
}
