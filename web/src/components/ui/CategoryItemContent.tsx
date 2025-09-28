'use client';

import * as React from 'react';

import type { CategoryNode } from './CategorySelector';

type CategoryItemContentProps = {
  category: CategoryNode;
  isSelected: boolean;
  isHighlighted: boolean;
  level: number;
  onSelect: () => void;
};

export function CategoryItemContent({
  category,
  isSelected,
  isHighlighted,
  level,
  onSelect,
}: CategoryItemContentProps) {
  return (
    <div
      className={`group flex-1 rounded-lg transition-all duration-200 ${getIndentationClass(
        level
      )} ${
        isSelected
          ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
          : isHighlighted
            ? 'border border-amber-200 bg-amber-50 text-amber-700'
            : 'hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <button
        onClick={onSelect}
        className="w-full cursor-pointer rounded-md px-1 py-2.5 text-left transition-colors duration-200 disabled:cursor-default"
        disabled={isSelected}
      >
        <div className="flex items-center">
          {isSelected && (
            <div className="mr-2 flex-shrink-0">
              <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-blue-500">
                <svg
                  className="h-2.5 w-2.5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
          <span
            className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'} ${isHighlighted ? 'text-amber-800' : ''}`}
          >
            {category.name}
          </span>
        </div>
      </button>
    </div>
  );
}

function getIndentationClass(level: number): string {
  // Support up to 10 levels of nesting with proper Tailwind classes
  const indentationClasses = [
    'pl-3', // level 0
    'pl-6', // level 1
    'pl-9', // level 2
    'pl-12', // level 3
    'pl-16', // level 4
    'pl-20', // level 5
    'pl-24', // level 6
    'pl-28', // level 7
    'pl-32', // level 8
    'pl-36', // level 9
    'pl-40', // level 10+
  ];

  return indentationClasses[Math.min(level, indentationClasses.length - 1)];
}
