import * as React from 'react';

interface ImageModalMainImageProps {
  currentImage: {
    id: string;
    url: string;
    alt?: string | null;
    color?: string | null;
  };
  currentIndex: number;
  selectedImages: Set<string>;
  onImageToggle?: (
    imageId: string,
    isActive: boolean,
    event: React.MouseEvent
  ) => void;
  isUpdating?: string | null;
}

export function ImageModalMainImage({
  currentImage,
  currentIndex,
  selectedImages,
  onImageToggle,
  isUpdating,
}: ImageModalMainImageProps) {
  return (
    <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="relative flex items-center">
        <img
          src={currentImage.url}
          alt={currentImage.alt || `Изображение ${currentIndex + 1}`}
          className={`max-h-[70vh] max-w-full object-contain ${
            selectedImages.has(currentImage.id) ? 'ring-4 ring-blue-500' : ''
          }`}
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            console.error('Failed to load full-size image:', currentImage.url);
          }}
        />
        {/* Selection indicator */}
        {selectedImages.has(currentImage.id) && (
          <div className="absolute left-2 top-2 rounded-full bg-blue-500 p-1">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
        {/* Delete button */}
        {onImageToggle && (
          <div className="absolute -right-12 top-1/2 -translate-y-1/2">
            <button
              onClick={e => onImageToggle(currentImage.id, false, e)}
              disabled={isUpdating === currentImage.id}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600 disabled:opacity-50"
              title="Удалить изображение"
            >
              {isUpdating === currentImage.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
