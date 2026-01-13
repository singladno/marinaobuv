'use client';

import {
  XMarkIcon,
  StarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import { ColorSelect } from './ColorSelect';
import type { ImageFile } from './ProductImageUpload';

interface ProductImageColorGroupProps {
  color: string;
  images: ImageFile[];
  onRemove: (id: string) => void;
  onRestore?: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onColorChange: (imageId: string, color: string) => void;
  disabled?: boolean;
}

export function ProductImageColorGroup({
  color,
  images,
  onRemove,
  onRestore,
  onSetPrimary,
  onColorChange,
  disabled = false,
}: ProductImageColorGroupProps) {
  const activeImages = images.filter(img => !img.isDeleted);
  const primaryImage = activeImages.find(img => img.isPrimary);
  const hasPrimary = !!primaryImage;

  return (
    <div className="space-y-3 rounded-xl border-2 border-purple-100 bg-purple-50/30 p-4 dark:border-purple-900/30 dark:bg-purple-950/20">
      {/* Color Group Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {color || 'Без цвета'}
          </h3>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            {activeImages.length}{' '}
            {activeImages.length === 1
              ? 'изображение'
              : activeImages.length < 5
                ? 'изображения'
                : 'изображений'}
          </span>
          {hasPrimary && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
              <StarIcon className="h-3 w-3 fill-yellow-500" />
              Главное
            </span>
          )}
        </div>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map(image => {
          const isDeleted = image.isDeleted ?? false;
          const isPrimary = image.isPrimary && !isDeleted;

          return (
            <div key={image.id} className="space-y-2">
              <div
                className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-gray-100 transition-all ${
                  isDeleted
                    ? 'opacity-50 grayscale'
                    : isPrimary
                      ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800'
                      : 'border-gray-200 dark:border-gray-700'
                } dark:bg-gray-800`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.preview}
                  alt={`Preview ${image.color || 'image'}`}
                  className="h-full w-full object-cover"
                />

                {isDeleted ? (
                  // Restore button when deleted
                  <button
                    type="button"
                    onClick={() => onRestore?.(image.id)}
                    disabled={disabled}
                    className="source-icon-hover-toggle absolute right-2 top-2 z-20 cursor-pointer rounded-full bg-green-500 p-1.5 text-white transition-opacity hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-0"
                    aria-label="Восстановить изображение"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => onRemove(image.id)}
                      disabled={disabled}
                      className="source-icon-hover-toggle absolute right-2 top-2 z-20 cursor-pointer rounded-full bg-red-500 p-1.5 text-white transition-opacity hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-0"
                      aria-label="Удалить изображение"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                    {/* Set Primary button */}
                    <button
                      type="button"
                      onClick={() => onSetPrimary(image.id)}
                      disabled={disabled || isPrimary}
                      className={`absolute left-2 top-2 z-20 cursor-pointer rounded-full p-1.5 transition-opacity ${
                        isPrimary
                          ? 'bg-purple-600 opacity-100'
                          : 'source-icon-hover-toggle bg-gray-700 hover:bg-purple-600'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                      aria-label="Сделать главным для этого цвета"
                    >
                      <StarIcon
                        className={`h-4 w-4 ${isPrimary ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`}
                      />
                    </button>
                  </>
                )}
              </div>

              {!isDeleted && (
                <div className="space-y-1">
                  <ColorSelect
                    key={`${image.id}-${image.color || ''}`}
                    value={image.color || ''}
                    onChange={selectedColor => {
                      // Immediately commit when selecting from dropdown
                      if (selectedColor !== image.color) {
                        onColorChange(image.id, selectedColor);
                      }
                    }}
                    disabled={disabled}
                    error={!image.color?.trim() ? 'Цвет обязателен' : undefined}
                    required
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
