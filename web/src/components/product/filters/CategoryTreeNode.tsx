'use client';

import { ChevronRightIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

import { Checkbox } from '@/components/ui/Checkbox';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import { getIndentationClass } from '@/utils/categoryUtils';

type CategoryTreeNodeProps = {
  node: CategoryNode;
  selectedIds: string[];
  onToggle: (id: string) => void;
  level?: number;
  searchTerm?: string;
};

export function CategoryTreeNode({
  node,
  selectedIds,
  onToggle,
  level = 0,
  searchTerm = '',
}: CategoryTreeNodeProps) {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const hasChildren = !!node.children && node.children.length > 0;
  const normalizedQuery = searchTerm.trim().toLowerCase();

  // Check if current node matches the search
  const currentNodeMatches = React.useMemo(() => {
    if (!normalizedQuery) return false;
    return node.name.toLowerCase().includes(normalizedQuery);
  }, [node.name, normalizedQuery]);

  const subtreeMatches = React.useMemo(() => {
    if (!normalizedQuery) return true;

    // Recursive function to check if any node in the subtree matches
    const checkSubtree = (currentNode: CategoryNode): boolean => {
      // Check if current node matches
      if (currentNode.name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Recursively check all children
      if (currentNode.children && currentNode.children.length > 0) {
        return currentNode.children.some(child => checkSubtree(child));
      }

      return false;
    };

    return checkSubtree(node);
  }, [node, normalizedQuery]);

  const hasSelectedInSubtree = React.useMemo(() => {
    if (selectedIds.includes(node.id)) return true;
    return (node.children || []).some(c => {
      if (selectedIds.includes(c.id)) return true;
      return (c.children || []).some(gc => selectedIds.includes(gc.id));
    });
  }, [node, selectedIds]);

  // Helper function to check if this node is in the path to any selected category
  const isInPathToSelected = React.useMemo(() => {
    if (!selectedIds.length || !node.children) return false;

    // Recursive function to check if any selectedId is a descendant of this node
    const hasSelectedDescendant = (children: CategoryNode[]): boolean => {
      return children.some(child => {
        if (selectedIds.includes(child.id)) return true;
        if (child.children && child.children.length > 0) {
          return hasSelectedDescendant(child.children);
        }
        return false;
      });
    };

    return hasSelectedDescendant(node.children);
  }, [node.children, selectedIds]);

  const [expanded, setExpanded] = React.useState<boolean>(
    // Only expand if in search mode, subtree matches, or in path to selected
    !normalizedQuery || subtreeMatches || isInPathToSelected
  );
  const checked = selectedIds.includes(node.id);
  const isParentOfSelected = isInPathToSelected && !checked;

  React.useEffect(() => {
    // Expand/collapse in response to search and selection changes
    if (normalizedQuery) {
      // When searching, expand if this node or any of its children match the search
      // This ensures parent categories are expanded to show matching subcategories
      setExpanded(subtreeMatches || isInPathToSelected);
    } else {
      // Only expand if this node is in the path to a selected category
      setExpanded(isInPathToSelected);
    }
  }, [normalizedQuery, subtreeMatches, isInPathToSelected]);

  // Scroll to view when this item is selected
  React.useEffect(() => {
    if (checked && nodeRef.current) {
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
  }, [checked]);

  if (!subtreeMatches) return null;

  const renderHighlighted = (text: string) => {
    if (!normalizedQuery) return text;
    const idx = text.toLowerCase().indexOf(normalizedQuery);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + normalizedQuery.length);
    const after = text.slice(idx + normalizedQuery.length);
    return (
      <>
        {before}
        <mark className="rounded bg-yellow-100 px-0 py-0 text-yellow-900">
          {match}
        </mark>
        {after}
      </>
    );
  };

  return (
    <div ref={nodeRef} className="animate-in fade-in-0 duration-150">
      <div className={`flex items-center ${getIndentationClass(level)}`}>
        {hasChildren ? (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mr-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-gray-100"
            aria-label={expanded ? 'Свернуть' : 'Развернуть'}
            title={expanded ? 'Свернуть' : 'Развернуть'}
          >
            <ChevronRightIcon
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <div className="mr-1 h-6 w-6" />
        )}

        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-all duration-200 ${
            checked
              ? 'bg-purple-50'
              : isParentOfSelected
                ? 'bg-blue-50'
                : 'hover:bg-gray-50'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <Checkbox
            checked={checked}
            onCheckedChange={() => onToggle(node.id)}
          />
          <span
            className={`text-sm transition-colors duration-200 ${
              checked
                ? 'font-semibold text-purple-800'
                : isParentOfSelected
                  ? 'font-medium text-blue-800'
                  : 'font-medium text-gray-800'
            }`}
          >
            {renderHighlighted(node.name)}
          </span>
        </label>
      </div>

      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="pl-2">
            {node.children!.map(child => (
              <CategoryTreeNode
                key={child.id}
                node={child}
                selectedIds={selectedIds}
                onToggle={onToggle}
                level={level + 1}
                searchTerm={currentNodeMatches ? '' : searchTerm}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
