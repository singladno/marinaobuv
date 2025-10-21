'use client';

import React, { useState } from 'react';

import { ImageModalBadges } from '@/components/ui/ImageModalBadges';
import { ImageModalMainImage } from '@/components/ui/ImageModalMainImage';
import { ImageModalNavigation } from '@/components/ui/ImageModalNavigation';
import { ImageModalThumbnails } from '@/components/ui/ImageModalThumbnails';
import { Modal } from '@/components/ui/Modal';
import type { ProductImage } from '@/types/product';

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ProductImage[];
  productName: string;
}

export function ProductImageModal({
  isOpen,
  onClose,
  images,
  productName,
}: ProductImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const safeCurrentIndex = Math.max(
    0,
    Math.min(currentIndex, images.length - 1)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Изображения товара: ${productName}`}
      size="xl"
      className="!max-w-none"
    >
      <div className="relative">
        {/* Navigation buttons */}
        <ImageModalNavigation
          totalImages={images.length}
          onPrevious={() =>
            setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
          }
          onNext={() =>
            setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
          }
        />

        {/* Main image */}
        <ImageModalMainImage
          currentImage={{
            id: currentImage.id,
            url: currentImage.url,
            alt: currentImage.alt,
            color: null,
            isActive: true,
          }}
          currentIndex={safeCurrentIndex}
          selectedImages={new Set()}
          onImageToggle={() => {}}
          isUpdating={null}
        />

        {/* Badges */}
        <ImageModalBadges
          currentImage={{
            color: null,
          }}
          currentIndex={safeCurrentIndex}
          totalImages={images.length}
        />

        {/* Thumbnail strip */}
        <ImageModalThumbnails
          images={images.map(img => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            color: null,
            isActive: true,
          }))}
          currentIndex={safeCurrentIndex}
          selectedImages={new Set()}
          onImageSelect={setCurrentIndex}
          onToggleSelection={() => {}}
        />
      </div>
    </Modal>
  );
}
