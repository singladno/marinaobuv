'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, StarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { ColorSelect } from './ColorSelect';
import type { ImageFile } from './ProductImageUpload';

interface ProductImageWithColorProps {
  image: ImageFile;
  onRemove: (id: string) => void;
  onRestore?: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function ProductImageWithColor({
  image,
  onRemove,
  onRestore,
  onSetPrimary,
  onColorChange,
  disabled = false,
  hasError = false,
}: ProductImageWithColorProps) {
  const isDeleted = image.isDeleted ?? false;

  return (
    <div className="space-y-2">
      <div
        className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-gray-100 transition-all ${
          isDeleted
            ? 'opacity-50 grayscale'
            : hasError
              ? 'border-red-500'
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
            className="source-icon-hover-toggle absolute right-2 top-2 z-20 cursor-pointer rounded-full bg-green-500 p-1.5 text-white transition-opacity hover:bg-green-600 disabled:opacity-0 disabled:cursor-not-allowed"
            aria-label="Восстановить изображение"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        ) : (
          // Delete button when not deleted
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            disabled={disabled}
            className="source-icon-hover-toggle absolute right-2 top-2 z-20 cursor-pointer rounded-full bg-red-500 p-1.5 text-white transition-opacity hover:bg-red-600 disabled:opacity-0 disabled:cursor-not-allowed"
            aria-label="Удалить изображение"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
        {!isDeleted && (
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
        )}
      </div>

      {!isDeleted && (
        <div className="space-y-1">
          <ColorSelect
            value={image.color || ''}
            onChange={color => {
              onColorChange(image.id, color);
            }}
            disabled={disabled}
            error={hasError ? 'Цвет обязателен' : undefined}
            required
          />
        </div>
      )}
    </div>
  );
}
