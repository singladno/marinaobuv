'use client';

import { ChevronRightIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

import { CategoryItemContent } from './CategoryItemContent';
import type { CategoryNode } from './CategorySelector';
import { CategoryTree } from './CategoryTree';

type CategoryNodeProps = {
  category: CategoryNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  level?: number;
};

export function CategoryNode({
  category,
  selectedId,
  onSelect,
  searchTerm,
  level = 0,
}: CategoryNodeProps) {
  const nodeRef = React.useRef<HTMLDivElement>(null);

  // Helper function to check if this category is in the path to the selected category
  const isInPathToSelected = React.useMemo(() => {
    if (!selectedId || !category.children) return false;

    // Recursive function to check if selectedId is a descendant of this category
    const hasSelectedDescendant = (children: CategoryNode[]): boolean => {
      return children.some(child => {
        if (child.id === selectedId) return true;
        if (child.children && child.children.length > 0) {
          return hasSelectedDescendant(child.children);
        }
        return false;
      });
    };

    return hasSelectedDescendant(category.children);
  }, [category.children, selectedId]);

  const [isExpanded, setIsExpanded] = React.useState(
    searchTerm.length > 0 || isInPathToSelected
  );
  const isSelected = category.id === selectedId;
  const isParentOfSelected = isInPathToSelected;
  const hasChildren = category.children && category.children.length > 0;
  const isHighlighted =
    searchTerm.length > 0 && category.name.toLowerCase().includes(searchTerm);

  // Update expansion state when selectedId changes
  React.useEffect(() => {
    if (searchTerm.length > 0) {
      setIsExpanded(true);
    } else {
      setIsExpanded(isInPathToSelected);
    }
  }, [selectedId, searchTerm, isInPathToSelected]);

  // Scroll to view when this item is selected
  React.useEffect(() => {
    if (isSelected && nodeRef.current) {
      // Wait for expansion animations to complete before scrolling
      const timeoutId = setTimeout(() => {
        if (nodeRef.current) {
          nodeRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }, 350); // Wait for the 300ms expansion animation + buffer

      return () => clearTimeout(timeoutId);
    }
  }, [isSelected]);

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    // Only allow selecting leaf nodes (categories without children)
    if (!hasChildren) {
      onSelect(category.id);
    }
  };

  return (
    <div
      ref={nodeRef}
      className="animate-in fade-in-0 slide-in-from-left-1 duration-200"
    >
      <div className="flex items-center">
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="mr-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-gray-100"
            title={isExpanded ? 'Свернуть категорию' : 'Развернуть категорию'}
            aria-label={
              isExpanded ? 'Свернуть категорию' : 'Развернуть категорию'
            }
          >
            <ChevronRightIcon
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}
            />
          </button>
        ) : (
          <div className="mr-2 h-6 w-6"></div>
        )}

        <CategoryItemContent
          category={category}
          isSelected={isSelected}
          isParentOfSelected={isParentOfSelected}
          isHighlighted={isHighlighted}
          level={level}
          onSelect={handleSelect}
          hasChildren={hasChildren}
        />
      </div>
      {hasChildren && category.children && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex">
            <div className="flex w-6 justify-center">
              <div className="w-px bg-gray-200"></div>
            </div>
            <div className="flex-1 pt-1">
              <CategoryTree
                categories={category.children}
                selectedId={selectedId}
                onSelect={onSelect}
                searchTerm={searchTerm}
                level={level + 1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
