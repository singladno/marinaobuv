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
  const hasChildren = !!node.children && node.children.length > 0;
  const normalizedQuery = searchTerm.trim().toLowerCase();

  const subtreeMatches = React.useMemo(() => {
    if (!normalizedQuery) return true;
    const self = node.name.toLowerCase().includes(normalizedQuery);
    const child = (node.children || []).some(c =>
      c.name.toLowerCase().includes(normalizedQuery)
    );
    const deep = (node.children || []).some(c =>
      (c.children || []).some(gc =>
        gc.name.toLowerCase().includes(normalizedQuery)
      )
    );
    return self || child || deep;
  }, [node, normalizedQuery]);

  const hasSelectedInSubtree = React.useMemo(() => {
    if (selectedIds.includes(node.id)) return true;
    return (node.children || []).some(c => {
      if (selectedIds.includes(c.id)) return true;
      return (c.children || []).some(gc => selectedIds.includes(gc.id));
    });
  }, [node, selectedIds]);

  const [expanded, setExpanded] = React.useState<boolean>(
    // By default, everything expanded; also expand when a descendant is selected
    !normalizedQuery || subtreeMatches || hasSelectedInSubtree
  );
  const checked = selectedIds.includes(node.id);

  React.useEffect(() => {
    // Expand/collapse in response to search and selection changes
    if (normalizedQuery) {
      setExpanded(subtreeMatches || hasSelectedInSubtree);
    } else {
      setExpanded(true);
    }
  }, [normalizedQuery, subtreeMatches, hasSelectedInSubtree]);

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
        <mark className="rounded bg-yellow-100 px-0.5 py-0 text-yellow-900">
          {match}
        </mark>
        {after}
      </>
    );
  };

  return (
    <div className="animate-in fade-in-0 duration-150">
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
          className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
          onClick={e => e.stopPropagation()}
        >
          <Checkbox
            checked={checked}
            onCheckedChange={() => onToggle(node.id)}
          />
          <span
            className={`text-sm ${checked ? 'font-medium text-purple-700' : 'text-gray-800'}`}
          >
            {renderHighlighted(node.name)}
          </span>
        </label>
      </div>

      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="pl-6">
            {node.children!.map(child => (
              <CategoryTreeNode
                key={child.id}
                node={child}
                selectedIds={selectedIds}
                onToggle={onToggle}
                level={level + 1}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
