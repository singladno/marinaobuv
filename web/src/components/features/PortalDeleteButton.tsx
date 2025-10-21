'use client';

import React from 'react';
import { createPortal } from 'react-dom';

interface PortalDeleteButtonProps {
  isVisible: boolean;
  position: { top: number; left: number };
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function PortalDeleteButton({
  isVisible,
  position,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: PortalDeleteButtonProps) {
  if (!isVisible || typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed z-50 p-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-opacity hover:bg-red-600"
        onClick={onDelete}
        aria-label="Удалить размер"
      >
        <svg
          className="block h-3 w-3"
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
    </div>,
    document.body
  );
}
