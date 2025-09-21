import * as React from 'react';

import { ImageModal } from '@/components/ui/ImageModal';
import { useImageHandling } from '@/hooks/useImageHandling';
import {
  isWAParserImage,
  isS3Image,
  sanitizeImageUrl,
} from '@/lib/image-security';
import type { Draft } from '@/types/admin';

import { ImageActionButton } from './ImageActionButton';
import { ImageThumbnail } from './ImageThumbnail';

interface ImagesCellProps {
  draftId: string;
  images: Draft['images'];
  onImageToggle?: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
}

export function ImagesCell({
  draftId,
  images,
  onImageToggle,
  onReload,
}: ImagesCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [hoveredImages, setHoveredImages] = React.useState<Set<string>>(
    new Set()
  );
  const imageRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const { isUpdating, handleImageToggle, handleBulkDelete, handleBulkSplit } =
    useImageHandling({
      draftId,
      onImageToggle,
      onReload,
    });

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

  return (
    <>
      <div className="flex gap-1 overflow-x-auto overflow-y-visible py-2">
        {sortedImages.map((img, index) => {
          // Check if it's a Yandex S3 image (uploaded during approval)
          if (!isS3Image(img.url)) {
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
              onMouseEnter={() =>
                setHoveredImages(prev => new Set(prev).add(img.id))
              }
              onMouseLeave={() =>
                setHoveredImages(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(img.id);
                  return newSet;
                })
              }
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
        onBulkDelete={handleBulkDelete}
        onBulkSplit={handleBulkSplit}
        isUpdating={isUpdating}
      />

      {Array.from(hoveredImages).map(hoveredImageId => {
        const imageRef = imageRefs.current[hoveredImageId];
        if (!imageRef) return null;

        return (
          <ImageActionButton
            key={hoveredImageId}
            imageId={hoveredImageId}
            isActive={
              sortedImages.find(img => img.id === hoveredImageId)?.isActive ===
              true
            }
            isUpdating={isUpdating === hoveredImageId}
            onToggle={handleImageToggle}
            onMouseEnter={() =>
              setHoveredImages(prev => new Set(prev).add(hoveredImageId))
            }
            onMouseLeave={() =>
              setHoveredImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(hoveredImageId);
                return newSet;
              })
            }
            imageRef={imageRef}
          />
        );
      })}
    </>
  );
}
