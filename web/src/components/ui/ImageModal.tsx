import * as React from 'react';

import { Modal } from './Modal';

interface ImageModalProps {
  images: Array<{
    id: string;
    url: string;
    alt?: string | null;
    color?: string | null;
  }>;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  onImageToggle?: (
    imageId: string,
    isActive: boolean,
    event: React.MouseEvent
  ) => void;
  isUpdating?: string | null;
}

export function ImageModal({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
  onImageToggle,
  isUpdating,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => {
    if (!isOpen || images.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        onImageToggle &&
        images.length > 0
      ) {
        e.preventDefault();
        const safeIndex = Math.min(currentIndex, images.length - 1);
        const currentImage = images[safeIndex];
        if (currentImage) {
          onImageToggle(currentImage.id, false, e as any);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onImageToggle, currentIndex, images]);

  if (!isOpen || images.length === 0) return null;

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.min(currentIndex, images.length - 1);
  const currentImage = images[safeCurrentIndex];

  // If currentImage is undefined, close the modal
  if (!currentImage) {
    onClose();
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Просмотр изображений"
      size="xl"
      className="!max-w-none"
    >
      <div className="relative">
        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentIndex(prev =>
                  prev > 0 ? prev - 1 : images.length - 1
                )
              }
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-lg hover:bg-white hover:text-gray-900 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Предыдущее изображение"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                setCurrentIndex(prev =>
                  prev < images.length - 1 ? prev + 1 : 0
                )
              }
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-lg hover:bg-white hover:text-gray-900 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Следующее изображение"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Main image */}
        <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="relative flex items-center">
            <img
              src={currentImage.url}
              alt={currentImage.alt || `Изображение ${safeCurrentIndex + 1}`}
              className="max-h-[70vh] max-w-full object-contain"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                console.error(
                  'Failed to load full-size image:',
                  currentImage.url
                );
              }}
            />
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

        {/* Color badge */}
        {currentImage.color && (
          <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-lg dark:bg-gray-800/90 dark:text-white">
            {currentImage.color}
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute right-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-lg dark:bg-gray-800/90 dark:text-white">
            {safeCurrentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(index)}
                className={`h-12 w-12 overflow-hidden rounded-lg border-2 shadow-lg transition-all ${
                  index === safeCurrentIndex
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt || `Миниатюра ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {img.color && (
                  <span className="absolute bottom-0 right-0 m-0.5 rounded bg-black/60 px-1 text-[10px] text-white">
                    {img.color}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
