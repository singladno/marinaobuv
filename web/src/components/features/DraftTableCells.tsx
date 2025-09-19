import * as React from 'react';

import { ImageModal } from '@/components/ui/ImageModal';
import { useImageHandling } from '@/hooks/useImageHandling';
import { isWAParserImage, sanitizeImageUrl } from '@/lib/image-security';
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
  const [hoveredImageId, setHoveredImageId] = React.useState<string | null>(
    null
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

      {hoveredImageId && imageRefs.current[hoveredImageId] && (
        <ImageActionButton
          imageId={hoveredImageId}
          isActive={
            sortedImages.find(img => img.id === hoveredImageId)?.isActive ===
            true
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
