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

  const { handleImageToggle } = useImageHandling({
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
              onImageClick={onImageClick}
              onImageToggle={() => {}}
              isUpdating={false}
              index={index}
            />
            {hoveredImages.has(image.id) && (
              <ImageActionButton
                imageId={image.id}
                isActive={image.isActive !== false}
                isUpdating={false}
                onToggle={handleImageToggle}
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
                imageRef={null}
              />
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
                  onImageClick={() => {
                    const activeIndex = activeImages.findIndex(
                      img => img.id === image.id
                    );
                    if (activeIndex !== -1) {
                      onImageClick(activeIndex);
                    }
                  }}
                  onImageToggle={() => {}}
                  isUpdating={false}
                  index={activeImages.findIndex(img => img.id === image.id)}
                />
                {hoveredImages.has(image.id) && (
                  <ImageActionButton
                    imageId={image.id}
                    isActive={image.isActive !== false}
                    isUpdating={false}
                    onToggle={handleImageToggle}
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
                    imageRef={null}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
