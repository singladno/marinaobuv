'use client';

import * as React from 'react';

import type { AdminCategoryNode } from '@/types/category';

import { CategoryTreeItemContent } from './CategoryTreeItemContent';

type Props = {
  node: AdminCategoryNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onCreateSubcategory?: (parentId: string) => void;
  onEdit?: (category: AdminCategoryNode) => void;
  onDelete?: (category: AdminCategoryNode) => void;
};

export function CategoryTreeItem({
  node,
  depth,
  selectedId,
  onSelect,
  searchTerm,
  expandedIds,
  onToggleExpand,
  onCreateSubcategory,
  onEdit,
  onDelete,
}: Props) {
  const hasChildren = (node.children || []).length > 0;
  const needle = searchTerm.trim().toLowerCase();
  const expanded =
    expandedIds.has(node.id) || (needle.length > 0 && hasChildren);
  const isSelected = node.id === selectedId;
  const highlight =
    needle.length > 0 &&
    (node.name.toLowerCase().includes(needle) ||
      node.urlPath.toLowerCase().includes(needle));

  const rowRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!isSelected || !rowRef.current) return;
    const t = requestAnimationFrame(() => {
      rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(t);
  }, [isSelected]);

  return (
    <div ref={rowRef}>
      <CategoryTreeItemContent
        node={node}
        isSelected={isSelected}
        highlight={highlight}
        hasChildren={hasChildren}
        expanded={expanded}
        depth={depth}
        onSelect={() => onSelect(node.id)}
        onToggleExpand={e => {
          e.stopPropagation();
          onToggleExpand(node.id);
        }}
        onCreateSubcategory={onCreateSubcategory}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {hasChildren && expanded && (
        <div className="ml-5 border-l border-gray-100 pl-2">
          <div className="space-y-1">
            {node.children.map(child => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              searchTerm={searchTerm}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onCreateSubcategory={onCreateSubcategory}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
