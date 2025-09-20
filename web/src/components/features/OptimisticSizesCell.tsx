'use client';

import React, { useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { DraftSize } from '@/types/admin';

interface OptimisticSizesCellProps {
  sizes: DraftSize[];
  onChange: (sizes: DraftSize[]) => Promise<void>;
  disabled?: boolean;
}

interface PortalDeleteButtonProps {
  isVisible: boolean;
  position: { top: number; left: number };
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function PortalDeleteButton({
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
          className="h-2.5 w-2.5"
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

export function OptimisticSizesCell({
  sizes,
  onChange,
  disabled = false,
}: OptimisticSizesCellProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [deleteButtonPosition, setDeleteButtonPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleAddSize = useCallback(async () => {
    if (disabled) return;
    const newSize = { size: '', quantity: 0 };
    const updatedSizes = [...(sizes || []), newSize];
    await onChange(updatedSizes);
  }, [disabled, sizes, onChange]);

  const handleDeleteSize = useCallback(
    async (index: number) => {
      if (disabled) return;
      const updatedSizes = (sizes || []).filter((_, i) => i !== index);
      await onChange(updatedSizes.length > 0 ? updatedSizes : null);
      setHoveredIndex(null);
    },
    [disabled, sizes, onChange]
  );

  const handleSizeChange = useCallback(
    async (
      index: number,
      field: 'size' | 'quantity',
      value: string | number
    ) => {
      if (disabled) return;
      const updatedSizes = [...(sizes || [])];
      updatedSizes[index] = { ...updatedSizes[index], [field]: value };
      await onChange(updatedSizes);
    },
    [disabled, sizes, onChange]
  );

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (disabled) return;

      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      setHoveredIndex(index);

      const chipElement = chipRefs.current[index];
      if (chipElement) {
        const rect = chipElement.getBoundingClientRect();
        setDeleteButtonPosition({
          top: rect.top - 24, // 24px above the chip for better visibility
          left: rect.left + rect.width / 2 - 16, // Center horizontally, 16px is half of total area (32px with padding)
        });
      }
    },
    [disabled]
  );

  const handleMouseLeave = useCallback(() => {
    // Add a delay before hiding to allow moving to the delete button
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredIndex(null);
    }, 150); // 150ms delay
  }, []);

  const handleDeleteButtonMouseEnter = useCallback(() => {
    // Clear hide timeout when hovering over delete button
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleDeleteButtonMouseLeave = useCallback(() => {
    // Hide immediately when leaving delete button
    setHoveredIndex(null);
  }, []);

  return (
    <>
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {(sizes || []).map((size, index) => (
          <div
            key={size.id || `size-${index}`}
            ref={el => (chipRefs.current[index] = el)}
            className="group relative flex flex-shrink-0 flex-col items-center justify-center rounded-full bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Size input */}
            <div className="flex w-8 justify-center">
              <input
                type="text"
                value={size.size || ''}
                onChange={e => handleSizeChange(index, 'size', e.target.value)}
                className="w-full bg-transparent text-center text-sm font-semibold outline-none"
                placeholder="?"
                aria-label={`Размер ${index + 1}`}
                disabled={disabled}
              />
            </div>

            {/* Quantity input */}
            <div className="flex w-8 justify-center">
              <input
                type="number"
                value={size.quantity || 0}
                onChange={e =>
                  handleSizeChange(
                    index,
                    'quantity',
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full bg-transparent text-center text-xs outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min="0"
                aria-label={`Количество ${index + 1}`}
                disabled={disabled}
              />
            </div>
          </div>
        ))}

        {/* Add button */}
        {!disabled && (
          <button
            type="button"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            onClick={handleAddSize}
            aria-label="Добавить размер"
          >
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Portal Delete Button */}
      <PortalDeleteButton
        isVisible={hoveredIndex !== null}
        position={deleteButtonPosition}
        onDelete={() => hoveredIndex !== null && handleDeleteSize(hoveredIndex)}
        onMouseEnter={handleDeleteButtonMouseEnter}
        onMouseLeave={handleDeleteButtonMouseLeave}
      />
    </>
  );
}
