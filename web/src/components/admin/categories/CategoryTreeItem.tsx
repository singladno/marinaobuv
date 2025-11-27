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
  onCreateSubcategory,
  onEdit,
  onDelete,
}: Props) {
  const hasChildren = (node.children || []).length > 0;
  const [expanded, setExpanded] = React.useState(depth < 2);
  const isSelected = node.id === selectedId;
  const needle = searchTerm.trim().toLowerCase();
  const highlight =
    needle.length > 0 &&
    (node.name.toLowerCase().includes(needle) ||
      node.urlPath.toLowerCase().includes(needle));

  React.useEffect(() => {
    if (needle.length > 0) setExpanded(true);
  }, [needle]);

  return (
    <div>
      <CategoryTreeItemContent
        node={node}
        isSelected={isSelected}
        highlight={highlight}
        hasChildren={hasChildren}
        expanded={expanded}
        onSelect={() => onSelect(node.id)}
        onToggleExpand={e => {
          e.stopPropagation();
          setExpanded(prev => !prev);
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
