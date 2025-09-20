'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { DraftImage } from '@/types/admin';
import { ImageModal } from '@/components/ui/ImageModal';
import { ImageThumbnail } from './ImageThumbnail';
import { ImageActionButton } from './ImageActionButton';
import { isWAParserImage, sanitizeImageUrl } from '@/lib/image-security';

interface OptimisticImagesCellProps {
  draftId: string;
  images: DraftImage[];
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
}

export function OptimisticImagesCell({
  draftId,
  images,
  onImageToggle,
  onReload,
}: OptimisticImagesCellProps) {
  const [togglingImages, setTogglingImages] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const imageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleImageToggle = useCallback(
    async (imageId: string, isActive: boolean, event: React.MouseEvent) => {
      event.stopPropagation();
      setTogglingImages(prev => new Set(prev).add(imageId));

      try {
        await onImageToggle(imageId, isActive);
      } catch (error) {
        console.error('Failed to toggle image:', error);
      } finally {
        setTogglingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
      }
    },
    [onImageToggle]
  );

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  }, []);

  const setImageRef = useCallback((imageId: string) => {
    return (el: HTMLDivElement | null) => {
      imageRefs.current[imageId] = el;
    };
  }, []);

  const sortedImages = (images || []).sort(
    (a, b) => (a.sort || 0) - (b.sort || 0)
  );

  if (!sortedImages.length) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <>
      <div className="flex gap-1 overflow-x-auto overflow-y-visible py-2">
        {sortedImages.map((img, index) => {
          // Check if it's a WA parser image
          if (!isWAParserImage(img.url)) {
            return (
              <div
                key={img.id}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-yellow-200 bg-yellow-50 text-xs font-medium text-yellow-600 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-400"
                title="Неизвестный источник изображения"
              >
                ?
              </div>
            );
          }

          return (
            <div
              key={img.id}
              ref={setImageRef(img.id)}
              onMouseEnter={() => setHoveredImageId(img.id)}
              onMouseLeave={() => setHoveredImageId(null)}
            >
              <ImageThumbnail
                image={img}
                onImageClick={handleImageClick}
                onImageToggle={handleImageToggle}
                isUpdating={togglingImages.has(img.id)}
                index={index}
              />
            </div>
          );
        })}
      </div>

      <ImageModal
        images={sortedImages.map(img => ({
          id: img.id,
          url: sanitizeImageUrl(img.url),
          alt: img.alt,
          color: img.color || null,
          isActive: img.isActive,
        }))}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialIndex={selectedImageIndex}
        onImageToggle={handleImageToggle}
        isUpdating={Array.from(togglingImages)[0] || null}
      />

      {hoveredImageId && imageRefs.current[hoveredImageId] && (
        <ImageActionButton
          imageId={hoveredImageId}
          isActive={
            sortedImages.find(img => img.id === hoveredImageId)?.isActive ||
            false
          }
          isUpdating={togglingImages.has(hoveredImageId)}
          onToggle={handleImageToggle}
          onMouseEnter={() => setHoveredImageId(hoveredImageId)}
          onMouseLeave={() => setHoveredImageId(null)}
          imageRef={imageRefs.current[hoveredImageId]}
        />
      )}
    </>
  );
}
