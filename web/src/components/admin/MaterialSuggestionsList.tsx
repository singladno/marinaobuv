'use client';

import { useRef, useEffect } from 'react';

interface MaterialSuggestionsListProps {
  suggestions: string[];
  isOpen: boolean;
  highlightedIndex: number;
  onSelect: (material: string) => void;
}

export function MaterialSuggestionsList({
  suggestions,
  isOpen,
  highlightedIndex,
  onSelect,
}: MaterialSuggestionsListProps) {
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
      {suggestions.map((material, index) => (
        <li
          key={material}
          onClick={() => onSelect(material)}
          className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
            index === highlightedIndex
              ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {material}
        </li>
      ))}
    </ul>
  );
}

