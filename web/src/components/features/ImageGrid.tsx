import * as React from 'react';

import { useImageHandling } from '@/hooks/useImageHandling';
import type { Draft } from '@/types/admin';

import { ImageActionButton } from './ImageActionButton';
import { ImageThumbnail } from './ImageThumbnail';

interface ImageGridProps {
  draftId: string;
  images: Draft['images'];
  onImageToggle?: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
  onImageClick: (index: number) => void;
}

export function ImageGrid({
  draftId,
  images,
  onImageToggle,
  onReload,
  onImageClick,
}: ImageGridProps) {
  const [hoveredImages, setHoveredImages] = React.useState<Set<string>>(
    new Set()
  );

  const { handleImageToggle, handleImageDelete } = useImageHandling({
    draftId,
    onImageToggle,
    onReload,
  });

  const activeImages = images?.filter(img => img.isActive !== false) || [];
  const inactiveImages = images?.filter(img => img.isActive === false) || [];

  if (activeImages.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-gray-500">
        Нет изображений
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {activeImages.map((image, index) => (
          <div
            key={image.id}
            className="relative"
            onMouseEnter={() =>
              setHoveredImages(prev => new Set(prev).add(image.id))
            }
            onMouseLeave={() =>
              setHoveredImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(image.id);
                return newSet;
              })
            }
          >
            <ImageThumbnail
              image={image}
              onClick={() => onImageClick(index)}
              className="h-12 w-12 cursor-pointer rounded border border-gray-200 hover:border-blue-300"
            />
            {hoveredImages.has(image.id) && (
              <div className="absolute -right-1 -top-1 z-10">
                <ImageActionButton
                  image={image}
                  onToggle={handleImageToggle}
                  onDelete={handleImageDelete}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {inactiveImages.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-500">Скрытые:</div>
          <div className="flex flex-wrap gap-1">
            {inactiveImages.map(image => (
              <div
                key={image.id}
                className="relative opacity-50"
                onMouseEnter={() =>
                  setHoveredImages(prev => new Set(prev).add(image.id))
                }
                onMouseLeave={() =>
                  setHoveredImages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(image.id);
                    return newSet;
                  })
                }
              >
                <ImageThumbnail
                  image={image}
                  onClick={() => {
                    const activeIndex = activeImages.findIndex(
                      img => img.id === image.id
                    );
                    if (activeIndex !== -1) {
                      onImageClick(activeIndex);
                    }
                  }}
                  className="h-8 w-8 cursor-pointer rounded border border-gray-200"
                />
                {hoveredImages.has(image.id) && (
                  <div className="absolute -right-1 -top-1 z-10">
                    <ImageActionButton
                      image={image}
                      onToggle={handleImageToggle}
                      onDelete={handleImageDelete}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
