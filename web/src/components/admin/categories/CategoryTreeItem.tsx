'use client';

import * as React from 'react';
import {
  ChevronRightIcon,
  PlusIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/Badge';
import type { AdminCategoryNode } from '@/types/category';

type Props = {
  node: AdminCategoryNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  onCreateSubcategory?: (parentId: string) => void;
  onEdit?: (category: AdminCategoryNode) => void;
};

export function CategoryTreeItem({
  node,
  depth,
  selectedId,
  onSelect,
  searchTerm,
  onCreateSubcategory,
  onEdit,
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
        className={`flex items-center gap-2 rounded-lg px-1 py-1 cursor-pointer ${
          isSelected ? 'bg-violet-50' : ''
        }`}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="cursor-pointer rounded-md p-1 text-gray-400 transition hover:bg-gray-100"
            onClick={e => {
              e.stopPropagation();
              setExpanded(prev => !prev);
            }}
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
        <div className="min-w-0 flex flex-1 flex-col rounded-md px-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`min-w-0 text-sm font-medium break-words ${
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
          <span className="min-w-0 break-all text-xs text-gray-500">
            /catalog{node.urlPath ? `/${node.urlPath}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onCreateSubcategory && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onCreateSubcategory(node.id);
              }}
              className="cursor-pointer rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600"
              aria-label="Создать подкатегорию"
              title="Создать подкатегорию"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onEdit(node);
              }}
              className="cursor-pointer rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-violet-600"
              aria-label="Редактировать"
              title="Редактировать"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
        </div>
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
                onCreateSubcategory={onCreateSubcategory}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
