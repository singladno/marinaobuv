'use client';

import React from 'react';

import { useSizesManagement } from '@/hooks/useSizesManagement';
import type { DraftSize } from '@/types/admin';

import { AddSizeButton } from './AddSizeButton';
import { PortalDeleteButton } from './PortalDeleteButton';
import { SizeChip } from './SizeChip';

interface OptimisticSizesCellProps {
  sizes: DraftSize[];
  onChange: (sizes: DraftSize[]) => Promise<void>;
  disabled?: boolean;
}

export function OptimisticSizesCell({
  sizes,
  onChange,
  disabled = false,
}: OptimisticSizesCellProps) {
  const {
    localSizes,
    isUpdating,
    updatingSizes,
    hoveredIndex,
    deleteButtonPosition,
    chipRefs,
    handleAddSize,
    handleDeleteSize,
    handleSizeChange,
    handleSizeBlur,
    handleMouseEnter,
    handleMouseLeave,
    handleDeleteButtonMouseEnter,
    handleDeleteButtonMouseLeave,
  } = useSizesManagement({ sizes, onChange, disabled });

  return (
    <>
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {(localSizes || []).map((size, index) => {
          const isUpdatingThisSize = updatingSizes.has(size.id);

          return (
            <SizeChip
              key={size.id || `size-${index}`}
              size={size}
              index={index}
              isUpdating={isUpdatingThisSize}
              disabled={disabled}
              onSizeChange={handleSizeChange}
              onSizeBlur={handleSizeBlur}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              chipRef={el => {
                chipRefs.current[index] = el;
              }}
            />
          );
        })}

        {/* Add button */}
        <AddSizeButton
          isUpdating={isUpdating}
          disabled={disabled}
          onAddSize={handleAddSize}
        />
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
