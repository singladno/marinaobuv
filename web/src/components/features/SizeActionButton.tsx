import * as React from 'react';
import { createPortal } from 'react-dom';

interface SizeActionButtonProps {
  isSaving: boolean;
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  sizeRef: HTMLDivElement | null;
}

export function SizeActionButton({
  isSaving,
  onDelete,
  onMouseEnter,
  onMouseLeave,
  sizeRef,
}: SizeActionButtonProps) {
  if (!sizeRef || typeof document === 'undefined') {
    return null;
  }

  const rect = sizeRef.getBoundingClientRect();

  return createPortal(
    <div
      className="fixed z-50 flex gap-1"
      // Dynamic positioning requires inline styles
      style={{
        left: `${rect.left + rect.width / 2 - 10}px`,
        top: `${rect.top - 14}px`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={e => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={isSaving}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600 disabled:opacity-50"
        title="Удалить размер"
      >
        {isSaving ? (
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
    </div>,
    document.body
  );
}
