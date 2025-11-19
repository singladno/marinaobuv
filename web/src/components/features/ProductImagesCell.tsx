import * as React from 'react';
import { Pencil } from 'lucide-react';

import type { Product } from '@/types/product';

import { ImageGallery } from './ImageGallery';

interface ProductImagesCellProps {
  product: Product;
  onEditImages?: (productId: string) => void;
}

export function ProductImagesCell({ product, onEditImages }: ProductImagesCellProps) {
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
    <div className="flex items-center gap-2">
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
      {/* Edit button for mobile/tablet view only */}
      {onEditImages && (
        <div className="tablet-mobile-view flex h-8 w-8 shrink-0 items-center justify-center">
          <button
            onClick={() => onEditImages(product.id)}
            className="flex h-full w-full items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-purple-500 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 cursor-pointer"
            title="Редактировать изображения"
            aria-label="Редактировать изображения"
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
