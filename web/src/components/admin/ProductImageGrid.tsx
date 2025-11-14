'use client';

import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';

import { Text } from '@/components/ui/Text';

import type { ImageFile } from './ProductImageUpload';

interface ProductImageGridProps {
  images: ImageFile[];
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  disabled?: boolean;
  maxImages?: number;
}

export function ProductImageGrid({
  images,
  onRemove,
  onSetPrimary,
  disabled = false,
  maxImages = 10,
}: ProductImageGridProps) {
  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.preview}
              alt={`Preview ${image.color || 'image'}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(image.id)}
              disabled={disabled}
              className="source-icon-hover-toggle absolute right-2 top-2 z-20 cursor-pointer rounded-full bg-red-500 p-1.5 text-white transition-opacity hover:bg-red-600 disabled:opacity-0 disabled:cursor-not-allowed"
              aria-label="Удалить изображение"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onSetPrimary(image.id)}
              disabled={disabled || image.isPrimary}
              className={`absolute left-2 top-2 z-20 cursor-pointer rounded-full p-1.5 transition-opacity ${
                image.isPrimary
                  ? 'bg-purple-600 opacity-100'
                  : 'source-icon-hover-toggle bg-gray-700 hover:bg-purple-600'
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label="Сделать главным"
            >
              <StarIcon className={`h-4 w-4 ${image.isPrimary ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
            </button>
          </div>
        ))}
      </div>

      {images.length >= maxImages && (
        <Text variant="caption" className="text-gray-500">
          Достигнуто максимальное количество изображений ({maxImages})
        </Text>
      )}
    </>
  );
}
