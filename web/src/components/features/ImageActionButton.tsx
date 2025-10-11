import * as React from 'react';
import { createPortal } from 'react-dom';

interface ImageActionButtonProps {
  imageId: string;
  isActive: boolean;
  isUpdating: boolean;
  onToggle: (
    imageId: string,
    isActive: boolean,
    event: React.MouseEvent
  ) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  imageRef: HTMLDivElement | null;
}

export function ImageActionButton({
  imageId,
  isActive,
  isUpdating,
  onToggle,
  onMouseEnter,
  onMouseLeave,
  imageRef,
}: ImageActionButtonProps) {
  if (!imageRef || typeof document === 'undefined') {
    return null;
  }

  const rect = imageRef.getBoundingClientRect();

  return createPortal(
    <div
      className="fixed z-50 flex h-10 w-10 items-center justify-center"
      style={{
        left: rect.left + rect.width / 2 - 20, // Center horizontally
        top: rect.top - 25, // Position higher above the image
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full text-white shadow-lg transition-colors ${
          isActive
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {isActive ? (
          <button
            onClick={e => onToggle(imageId, false, e)}
            disabled={isUpdating}
            className="flex h-full w-full items-center justify-center rounded-full disabled:opacity-50"
            title="Удалить изображение"
          >
            {isUpdating ? (
              <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg
                className="h-2.5 w-2.5"
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
        ) : (
          <button
            onClick={e => onToggle(imageId, true, e)}
            disabled={isUpdating}
            className="flex h-full w-full items-center justify-center rounded-full disabled:opacity-50"
            title="Восстановить изображение"
          >
            {isUpdating ? (
              <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg
                className="h-2.5 w-2.5"
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
        )}
      </div>
    </div>,
    document.body
  );
}
