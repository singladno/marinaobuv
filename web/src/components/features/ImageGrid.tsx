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
  singleRow?: boolean;
}

export function ImageGrid({
  draftId,
  images,
  onImageToggle,
  onReload,
  onImageClick,
  singleRow,
}: ImageGridProps) {
  const [hoveredImages, setHoveredImages] = React.useState<Set<string>>(
    new Set()
  );

  // Keep element refs for precise positioning of the floating action button
  const imageRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const { handleImageToggle, isUpdating } = useImageHandling({
    draftId,
    onImageToggle,
    onReload,
  });

  const activeImages = images?.filter(img => img.isActive !== false) || [];
  const inactiveImages = images?.filter(img => img.isActive === false) || [];
  const allImages = [...activeImages, ...inactiveImages];

  if (allImages.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-gray-500">
        Нет изображений
      </div>
    );
  }

  return (
    <div
      className={
        singleRow
          ? 'flex flex-nowrap gap-1 overflow-x-auto md:overflow-x-auto'
          : 'flex flex-wrap gap-1'
      }
    >
      {allImages.map((image, index) => (
        <div
          key={image.id}
          className={`relative flex-shrink-0 ${singleRow ? 'w-12 min-w-12' : ''} ${image.isActive === false ? 'opacity-50' : ''}`}
          ref={el => {
            imageRefs.current[image.id] = el;
          }}
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
              isUpdating={isUpdating === image.id}
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
              imageRef={imageRefs.current[image.id] || null}
            />
          )}
        </div>
      ))}
    </div>
  );
}
