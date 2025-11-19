import * as React from 'react';

import { useImageHandling } from '@/hooks/useImageHandling';
import type { Draft } from '@/types/admin';

import { ImageGridItem } from './ImageGridItem';

interface ImageGridProps {
  draftId: string;
  images: Draft['images'];
  onImageToggle?: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
  onImageClick: (index: number) => void;
  singleRow?: boolean;
  maxVisible?: number;
}

export function ImageGrid({
  draftId,
  images,
  onImageToggle,
  onReload,
  onImageClick,
  singleRow,
  maxVisible,
}: ImageGridProps) {
  const [hoveredImages, setHoveredImages] = React.useState<Set<string>>(
    new Set()
  );
  const imageRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const { handleImageToggle, isUpdating } = useImageHandling({
    draftId,
    onImageToggle,
    onReload,
  });

  const canToggleImages = Boolean(onImageToggle);
  const activeImages = images?.filter(img => img.isActive !== false) || [];
  const inactiveImages = images?.filter(img => img.isActive === false) || [];
  const allImages = [...activeImages, ...inactiveImages];
  const visibleCount =
    typeof maxVisible === 'number' ? Math.max(maxVisible, 0) : allImages.length;
  const visibleImages = allImages.slice(0, visibleCount);
  const extraCount = allImages.length - visibleImages.length;

  const handleMouseEnter = React.useCallback((imageId: string) => {
    setHoveredImages(prev => new Set(prev).add(imageId));
  }, []);

  const handleMouseLeave = React.useCallback((imageId: string) => {
    setHoveredImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  }, []);

  const registerImageRef = React.useCallback(
    (imageId: string, node: HTMLDivElement | null) => {
      imageRefs.current[imageId] = node;
    },
    []
  );

  if (allImages.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-gray-500">
        Нет изображений
      </div>
    );
  }

  const containerClassName = singleRow
    ? 'flex flex-nowrap gap-1 overflow-x-auto md:overflow-x-auto'
    : 'flex flex-wrap gap-1';

  return (
    <div className={containerClassName}>
      {visibleImages.map((image, index) => (
        <ImageGridItem
          key={image.id}
          image={image}
          index={index}
          extraCount={extraCount}
          isLastVisible={index === visibleImages.length - 1}
          singleRow={singleRow}
          canToggleImages={canToggleImages}
          hovered={hoveredImages.has(image.id)}
          onMouseEnter={() => handleMouseEnter(image.id)}
          onMouseLeave={() => handleMouseLeave(image.id)}
          onImageClick={onImageClick}
          registerRef={registerImageRef}
          imageRef={imageRefs.current[image.id] || null}
          isUpdating={isUpdating === image.id}
          onToggle={handleImageToggle}
        />
      ))}
    </div>
  );
}
