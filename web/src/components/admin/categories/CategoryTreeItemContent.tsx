'use client';

import * as React from 'react';
import { ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/Badge';
import type { AdminCategoryNode } from '@/types/category';
import type { CategoryIconName } from './CategoryIconSelector';
import { CategoryIcon } from './CategoryIconSelector';

import { CategoryTreeItemActions } from './CategoryTreeItemActions';

type Props = {
  node: AdminCategoryNode;
  isSelected: boolean;
  highlight: boolean;
  hasChildren: boolean;
  expanded: boolean;
  depth: number;
  onSelect: () => void;
  onToggleExpand: (e: React.MouseEvent) => void;
  onCreateSubcategory?: (parentId: string) => void;
  onEdit?: (category: AdminCategoryNode) => void;
  onDelete?: (category: AdminCategoryNode) => void;
};

export function CategoryTreeItemContent({
  node,
  isSelected,
  highlight,
  hasChildren,
  expanded,
  depth,
  onSelect,
  onToggleExpand,
  onCreateSubcategory,
  onEdit,
  onDelete,
}: Props) {
  const isFirstLevel = depth === 0;
  return (
    <div
      className={`flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 transition-colors duration-150 ${
        isSelected ? 'bg-violet-50' : 'hover:bg-gray-50 active:bg-gray-100'
      }`}
      onClick={onSelect}
    >
      {hasChildren ? (
        <button
          type="button"
          className="cursor-pointer rounded-md p-1 text-gray-400 transition hover:bg-gray-100"
          onClick={onToggleExpand}
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
      <div className="flex min-w-0 flex-1 flex-col rounded-md px-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          {isFirstLevel && node.icon && (
            <CategoryIcon
              iconName={node.icon as CategoryIconName}
              className="h-4 w-4 flex-shrink-0 text-gray-600"
            />
          )}
          {isFirstLevel && isSelected && (
            <CheckIcon className="h-4 w-4 flex-shrink-0 text-violet-600" />
          )}
          <span
            className={`min-w-0 break-words text-sm font-medium ${
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
      <CategoryTreeItemActions
        node={node}
        onCreateSubcategory={onCreateSubcategory}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
