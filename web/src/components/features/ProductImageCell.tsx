import Image from 'next/image';
import * as React from 'react';

import type { Product } from '@/types/product';
import { ProductImageModal } from './ProductImageModal';
import { isValidImageUrl } from '@/lib/image-security';

interface ProductImageCellProps {
  product: Product;
}

export function ProductImageCell({ product }: ProductImageCellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const primaryImage =
    product.images?.find(img => img.isPrimary) || product.images?.[0];

  const validPrimaryImage = primaryImage && isValidImageUrl(primaryImage.url)
    ? primaryImage
    : null;

  return (
    <div className="flex items-center space-x-3">
      <div className="h-12 w-12 flex-shrink-0">
        {validPrimaryImage ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            title="Открыть галерею"
            className="block"
          >
            <Image
              src={validPrimaryImage.url}
              alt={validPrimaryImage.alt || product.name}
              width={48}
              height={48}
              className="h-12 w-12 rounded object-cover"
            />
          </button>
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

      <ProductImageModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        images={product.images || []}
        productName={product.name}
      />
    </div>
  );
}
