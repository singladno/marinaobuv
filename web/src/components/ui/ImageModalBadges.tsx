import * as React from 'react';

interface ImageModalBadgesProps {
  currentImage: {
    color?: string | null;
  };
  currentIndex: number;
  totalImages: number;
}

export function ImageModalBadges({
  currentImage,
  currentIndex,
  totalImages,
}: ImageModalBadgesProps) {
  return (
    <>
      {/* Color badge */}
      {currentImage.color && (
        <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-lg dark:bg-gray-800/90 dark:text-white">
          {currentImage.color}
        </div>
      )}

      {/* Image counter */}
      {totalImages > 1 && (
        <div className="absolute right-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-lg dark:bg-gray-800/90 dark:text-white">
          {currentIndex + 1} / {totalImages}
        </div>
      )}
    </>
  );
}
