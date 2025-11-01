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

  // Filter out any null/undefined images and ensure we have valid image objects
  const validImages = React.useMemo(
    () => {
      if (!images || !Array.isArray(images)) {
        console.warn('ProductImageModal - Invalid images prop:', images);
        return [];
      }
      const filtered = images.filter((img, index) => {
        // Check if image has a valid URL (required)
        // ID can be generated if missing
        const hasUrl = img && typeof img === 'object' && img.url && typeof img.url === 'string' && img.url.trim() !== '';
        if (!hasUrl) {
          console.warn('ProductImageModal - Invalid image object (missing URL):', img);
        }
        return hasUrl;
      }).map((img, index) => ({
        // Ensure all images have an id, generate one if missing
        id: img.id || `image-${index}`,
        url: img.url,
        alt: img.alt || null,
      }));

      console.log('ProductImageModal - Processing images:', {
        original: images.length,
        filtered: filtered.length,
        sample: filtered[0]
      });
      if (filtered.length === 0 && images.length > 0) {
        console.error('ProductImageModal - All images filtered out. Original images:', images);
      }
      return filtered;
    },
    [images]
  );

  React.useEffect(() => {
    if (isOpen && validImages.length > 0) {
      setCurrentIndex(0);
    }
  }, [isOpen, validImages.length]);

  if (!isOpen) return null;

  if (validImages.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Изображения товара: ${productName}`}
        size="xl"
        className="!max-w-none"
      >
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-gray-500">Нет изображений для отображения</p>
        </div>
      </Modal>
    );
  }

  const currentImage = validImages[currentIndex];
  const safeCurrentIndex = Math.max(
    0,
    Math.min(currentIndex, validImages.length - 1)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Изображения товара: ${productName}`}
      size="xl"
      className="!max-w-[95vw] md:!max-w-[85vw] lg:!max-w-5xl"
    >
      <div className="relative flex flex-col min-h-0 max-h-[calc(90vh-120px)]">
        {/* Main image container - flex-1 to take available space */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {/* Navigation buttons */}
          {validImages.length > 1 && (
            <ImageModalNavigation
              totalImages={validImages.length}
              onPrevious={() =>
                setCurrentIndex(prev =>
                  prev > 0 ? prev - 1 : validImages.length - 1
                )
              }
              onNext={() =>
                setCurrentIndex(prev =>
                  prev < validImages.length - 1 ? prev + 1 : 0
                )
              }
            />
          )}

          {/* Main image */}
          {currentImage && (
            <ImageModalMainImage
              currentImage={{
                id: currentImage.id,
                url: currentImage.url,
                alt: currentImage.alt || null,
                color: null,
                isActive: true,
              }}
              currentIndex={safeCurrentIndex}
              selectedImages={new Set()}
              onImageToggle={() => {}}
              isUpdating={null}
            />
          )}

          {/* Badges */}
          <ImageModalBadges
            currentImage={{
              color: null,
            }}
            currentIndex={safeCurrentIndex}
            totalImages={validImages.length}
          />
        </div>

        {/* Thumbnail strip - fixed at bottom */}
        <div className="flex-shrink-0">
          <ImageModalThumbnails
            images={validImages.map(img => ({
              id: img.id,
              url: img.url,
              alt: img.alt || null,
              color: null,
              isActive: true,
            }))}
            currentIndex={safeCurrentIndex}
            selectedImages={new Set()}
            onImageSelect={setCurrentIndex}
            onToggleSelection={() => {}}
          />
        </div>
      </div>
    </Modal>
  );
}
