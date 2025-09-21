'use client';

import React, { useState } from 'react';
import type { Product } from '@/types/product';
import { ProductImageModal } from './ProductImageModal';

interface ProductImageCellProps {
  product: Product;
}

export function ProductImageCell({ product }: ProductImageCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!product.images || product.images.length === 0) {
    return (
      <div className="flex items-center">
        <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex gap-1 overflow-x-auto overflow-y-visible py-2">
        {/* Show all images as thumbnails */}
        {product.images.map((image, index) => (
          <button
            key={image.id}
            onClick={handleImageClick}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 transition-opacity hover:opacity-80 dark:border-gray-700 dark:bg-gray-800"
            aria-label={`Просмотр изображений товара ${product.name}`}
          >
            <img
              src={image.url}
              alt={image.alt || product.name}
              className="h-full w-full rounded object-cover"
            />
          </button>
        ))}
      </div>

      <ProductImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={product.images}
        productName={product.name}
      />
    </>
  );
}
