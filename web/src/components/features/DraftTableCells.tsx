import * as React from 'react';

import { ImageModal } from '@/components/ui/ImageModal';
import { isWAParserImage, sanitizeImageUrl } from '@/lib/image-security';
import type { Draft } from '@/types/admin';

import { ImageActionButton } from './ImageActionButton';
import { ImageThumbnail } from './ImageThumbnail';

interface ImagesCellProps {
  images: Draft['images'];
  onImageToggle?: (imageId: string, isActive: boolean) => Promise<void>;
}

export function ImagesCell({ images, onImageToggle }: ImagesCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [hoveredImageId, setHoveredImageId] = React.useState<string | null>(
    null
  );
  const imageRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const sortedImages = (images || []).sort(
    (a, b) => (a.sort || 0) - (b.sort || 0)
  );

  const setImageRef = React.useCallback((imageId: string) => {
    return (el: HTMLDivElement | null) => {
      imageRefs.current[imageId] = el;
    };
  }, []);

  if (!sortedImages.length) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handleImageToggle = async (
    imageId: string,
    isActive: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!onImageToggle || isUpdating) return;
    setIsUpdating(imageId);
    try {
      await onImageToggle(imageId, isActive);
    } catch (error) {
      console.error('Failed to toggle image status:', error);
    } finally {
      setIsUpdating(null);
    }
  };

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
                isUpdating={isUpdating === img.id}
                index={index}
              />
            </div>
          );
        })}
      </div>

      <ImageModal
        images={sortedImages
          .filter(img => img.isActive !== false)
          .map(img => ({
            id: img.id,
            url: sanitizeImageUrl(img.url),
            alt: img.alt,
            color: img.color || null,
          }))}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialIndex={selectedImageIndex}
        onImageToggle={handleImageToggle}
        isUpdating={isUpdating}
      />

      {hoveredImageId && imageRefs.current[hoveredImageId] && (
        <ImageActionButton
          imageId={hoveredImageId}
          isActive={
            sortedImages.find(img => img.id === hoveredImageId)?.isActive !==
            false
          }
          isUpdating={isUpdating === hoveredImageId}
          onToggle={handleImageToggle}
          onMouseEnter={() => setHoveredImageId(hoveredImageId)}
          onMouseLeave={() => setHoveredImageId(null)}
          imageRef={imageRefs.current[hoveredImageId]}
        />
      )}
    </>
  );
}
