'use client';

import * as React from 'react';

// Memoized checkbox component to prevent unnecessary re-renders
export const ProductSelectionCheckbox = React.memo(
  ({
    id,
    selected,
    onToggle,
  }: {
    id: string;
    selected: boolean;
    onToggle: (id: string) => void;
  }) => {
    const handleChange = React.useCallback(() => {
      onToggle(id);
    }, [id, onToggle]);

    return (
      <div className="flex h-full items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={handleChange}
          aria-label="Выбрать товар"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.onToggle === nextProps.onToggle
    );
  }
);

ProductSelectionCheckbox.displayName = 'ProductSelectionCheckbox';
