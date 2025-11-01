import Image from 'next/image';
import * as React from 'react';

interface ImageModalMainImageProps {
  currentImage: {
    id: string;
    url: string;
    alt?: string | null;
    color?: string | null;
    isActive?: boolean;
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
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  const isActive = currentImage.isActive === true;
  const imageOpacity = isActive ? 'opacity-100' : 'opacity-30';

  // Reset error state when image changes
  React.useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [currentImage.url]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
    console.error('Failed to load full-size image:', currentImage.url);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  if (!currentImage || !currentImage.url) {
    return (
      <div className="flex min-h-[300px] items-center justify-center bg-gray-50 dark:bg-gray-800 sm:min-h-[400px]">
        <p className="text-gray-500">Изображение недоступно</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 w-full h-full min-h-0 max-h-[60vh] md:max-h-[65vh] overflow-hidden">
      <div className="relative flex items-center justify-center w-full h-full min-h-0 p-4">
        {imageError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-red-100 p-4">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Изображение недоступно
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Не удалось загрузить изображение. Возможно, файл был удален или
              перемещен.
            </p>
            <button
              onClick={() => {
                setImageError(false);
                setImageLoading(true);
              }}
              className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
              </div>
            )}
            <Image
              src={currentImage.url}
              alt={currentImage.alt || `Изображение ${currentIndex + 1}`}
              width={800}
              height={600}
              className={`max-h-full max-w-full h-auto w-auto object-contain transition-opacity ${imageOpacity} ${
                selectedImages.has(currentImage.id)
                  ? 'ring-4 ring-blue-500'
                  : ''
              } ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              priority={currentIndex === 0}
              unoptimized
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                height: 'auto',
                width: 'auto'
              }}
            />
          </>
        )}
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
        {/* Toggle button */}
        {onImageToggle && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 md:right-4">
            <button
              onClick={e => onImageToggle(currentImage.id, !isActive, e)}
              disabled={isUpdating === currentImage.id}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:opacity-50 ${
                isActive
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
              title={
                isActive ? 'Удалить изображение' : 'Восстановить изображение'
              }
            >
              {isUpdating === currentImage.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isActive ? (
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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
