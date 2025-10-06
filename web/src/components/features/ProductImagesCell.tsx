import * as React from 'react';

import type { Product } from '@/types/product';

import { ImageGallery } from './ImageGallery';
import { useProductImageToggle } from '@/hooks/useProductImageToggle';

interface ProductImagesCellProps {
  product: Product;
}

export function ProductImagesCell({ product }: ProductImagesCellProps) {
  const { handleDelete, removed } = useProductImageToggle({
    onReload: undefined,
  });

  return (
    <div className="flex items-center">
      <ImageGallery
        draftId={product.id}
        images={(product.images as any)
          .filter((img: any) => !removed[img.id])
          .map((img: any) => ({
            ...img,
            // Treat product images as active by default; dim only after delete
            isActive: true,
          }))}
        onImageToggle={handleDelete as any}
        onReload={undefined}
        singleRow
      />
    </div>
  );
}
