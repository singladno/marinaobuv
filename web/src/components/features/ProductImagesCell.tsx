import * as React from 'react';

import type { Product } from '@/types/product';

import { ImageGallery } from './ImageGallery';

interface ProductImagesCellProps {
  product: Product;
}

export function ProductImagesCell({ product }: ProductImagesCellProps) {
  const [localImages, setLocalImages] = React.useState(product.images || []);

  React.useEffect(() => {
    setLocalImages(product.images || []);
  }, [product.images]);

  const canEditImages = !product.isActive;

  const handleToggle = React.useCallback(
    async (imageId: string, isActive: boolean) => {
      if (!canEditImages) return;
      setLocalImages(prevImages =>
        prevImages.map(img => (img.id === imageId ? { ...img, isActive } : img))
      );

      try {
        const res = await fetch(`/api/admin/products/images/${imageId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
        });

        if (!res.ok) {
          throw new Error('Failed to toggle image status');
        }
      } catch (error) {
        console.error('Failed to toggle image status:', error);
        setLocalImages(product.images || []);
      }
    },
    [canEditImages, product.images]
  );

  return (
    <div className="flex items-center">
      <ImageGallery
        draftId={product.id}
        images={localImages.map((img: any) => ({
          ...img,
          isActive: img.isActive !== false,
        }))}
        onImageToggle={canEditImages ? (handleToggle as any) : undefined}
        onReload={undefined}
        singleRow
        maxVisible={4}
      />
    </div>
  );
}
