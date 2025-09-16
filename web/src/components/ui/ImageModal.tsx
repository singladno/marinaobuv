import * as React from 'react';

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
}

export function ImageModal({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative max-h-[90vh] max-w-[90vw]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
          aria-label="Закрыть"
        >
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentIndex(prev =>
                  prev > 0 ? prev - 1 : images.length - 1
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75"
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
        <img
          src={currentImage.url}
          alt={currentImage.alt || `Изображение ${currentIndex + 1}`}
          className="max-h-[90vh] max-w-[90vw] object-contain"
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            console.error('Failed to load full-size image:', currentImage.url);
          }}
        />

        {/* Color badge */}
        {currentImage.color && (
          <div className="absolute left-4 top-4 rounded bg-black bg-opacity-60 px-2 py-1 text-sm text-white">
            {currentImage.color}
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black bg-opacity-50 px-3 py-1 text-white">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(index)}
                className={`h-12 w-12 overflow-hidden rounded border-2 ${
                  index === currentIndex ? 'border-white' : 'border-transparent'
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
    </div>
  );
}
