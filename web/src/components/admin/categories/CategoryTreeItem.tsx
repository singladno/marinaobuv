'use client';

import * as React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/Badge';
import type { AdminCategoryNode } from '@/types/category';

type Props = {
  node: AdminCategoryNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
};

export function CategoryTreeItem({
  node,
  depth,
  selectedId,
  onSelect,
  searchTerm,
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
      <div
        className={`flex items-start gap-2 rounded-lg px-1 py-1 ${
          isSelected ? 'bg-violet-50 ring-1 ring-violet-100' : ''
        }`}
      >
        {hasChildren ? (
          <button
            type="button"
            className="mt-1 rounded-md p-1 text-gray-400 transition hover:bg-gray-100"
            onClick={() => setExpanded(prev => !prev)}
            aria-label={expanded ? 'Свернуть' : 'Развернуть'}
          >
            <ChevronRightIcon
              className={`h-4 w-4 transition-transform ${
                expanded ? 'rotate-90 text-gray-600' : ''
              }`}
            />
          </button>
        ) : (
          <span className="w-6" />
        )}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex flex-1 flex-col rounded-md px-1 text-left focus:outline-none focus:ring-2 focus:ring-violet-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium ${
                highlight ? 'text-violet-700' : 'text-gray-900'
              }`}
            >
              {node.name}
            </span>
            {!node.isActive && (
              <Badge size="sm" className="text-[10px] uppercase">
                Черновик
              </Badge>
            )}
            <Badge
              size="sm"
              className="bg-gray-100 text-xs font-semibold text-gray-600"
            >
              {node.totalProductCount}
            </Badge>
          </div>
          <span className="text-xs text-gray-500">
            /catalog{node.urlPath ? `/${node.urlPath}` : ''}
          </span>
        </button>
      </div>
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
