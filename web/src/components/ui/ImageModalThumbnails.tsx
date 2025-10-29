import Image from 'next/image';
import * as React from 'react';

interface ImageModalThumbnailsProps {
  images: Array<{
    id: string;
    url: string;
    alt?: string | null;
    color?: string | null;
    isActive?: boolean;
  }>;
  currentIndex: number;
  selectedImages: Set<string>;
  onImageSelect: (index: number) => void;
  onToggleSelection: (imageId: string) => void;
}

export function ImageModalThumbnails({
  images,
  currentIndex,
  selectedImages,
  onImageSelect,
  onToggleSelection,
}: ImageModalThumbnailsProps) {
  if (images.length <= 1) return null;

  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
      {images.map((img, index) => {
        const isSelected = selectedImages.has(img.id);
        const isCurrent = index === currentIndex;
        const isActive = img.isActive === true;
        const imageOpacity = isActive ? 'opacity-100' : 'opacity-30';

        return (
          <div key={img.id} className="relative">
            <button
              onClick={() => onImageSelect(index)}
              className={`h-12 w-12 cursor-pointer overflow-hidden rounded-lg border-2 shadow-lg transition-all ${
                isCurrent
                  ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              } ${isSelected ? 'ring-2 ring-green-500' : ''}`}
            >
              <Image
                src={img.url}
                alt={img.alt || `Миниатюра ${index + 1}`}
                width={80}
                height={80}
                className={`h-full w-full object-cover transition-opacity ${imageOpacity}`}
              />
              {img.color && (
                <span className="absolute bottom-0 right-0 m-0.5 rounded bg-black/60 px-1 text-[10px] text-white">
                  {img.color}
                </span>
              )}
            </button>

            {/* Checkbox for selection */}
            <button
              onClick={e => {
                e.stopPropagation();
                onToggleSelection(img.id);
              }}
              className={`absolute -right-1 -top-1 h-5 w-5 cursor-pointer rounded-full border-2 shadow-sm transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800'
              }`}
              title={isSelected ? 'Снять выбор' : 'Выбрать изображение'}
            >
              {isSelected && (
                <svg
                  className="h-3 w-3"
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
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
