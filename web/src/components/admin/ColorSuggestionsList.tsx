'use client';

import { useRef, useEffect } from 'react';

import { getColorHex } from '@/utils/colorMapping';

interface ColorSuggestionsListProps {
  suggestions: string[];
  isOpen: boolean;
  highlightedIndex: number;
  onSelect: (color: string) => void;
}

export function ColorSuggestionsList({
  suggestions,
  isOpen,
  highlightedIndex,
  onSelect,
}: ColorSuggestionsListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  if (!isOpen || suggestions.length === 0) return null;

  return (
    <ul
      ref={listRef}
      className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
    >
      {suggestions.map((color, index) => {
        const colorHex = getColorHex(color);
        return (
          <li
            key={color}
            onClick={() => onSelect(color)}
            className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors ${
              index === highlightedIndex
                ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: colorHex }}
              aria-hidden="true"
            />
            <span>{color}</span>
          </li>
        );
      })}
    </ul>
  );
}

