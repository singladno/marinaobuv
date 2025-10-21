import * as React from 'react';

import type { Product } from '@/types/product';

import { ImageGallery } from './ImageGallery';
import { useProductImageToggle } from '@/hooks/useProductImageToggle';

interface ProductImagesCellProps {
  product: Product;
}

export function ProductImagesCell({ product }: ProductImagesCellProps) {
  // Local state to track image status changes optimistically
  const [localImages, setLocalImages] = React.useState(product.images || []);

  // Update local state when product changes (e.g., after page refresh)
  React.useEffect(() => {
    setLocalImages(product.images || []);
  }, [product.images]);

  const handleToggle = React.useCallback(
    async (imageId: string, isActive: boolean) => {
      // Optimistically update the UI immediately
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
        // Revert the optimistic update on error
        setLocalImages(product.images || []);
      }
    },
    [product.images]
  );

  return (
    <div className="flex items-center">
      <ImageGallery
        draftId={product.id}
        images={localImages.map((img: any) => ({
          ...img,
          isActive: img.isActive !== false, // Use the actual isActive value
        }))}
        onImageToggle={handleToggle as any}
        onReload={undefined}
        singleRow
      />
    </div>
  );
}
