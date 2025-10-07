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
};

export function CategoryTreeNode({
  node,
  selectedIds,
  onToggle,
  level = 0,
}: CategoryTreeNodeProps) {
  const hasChildren = !!node.children && node.children.length > 0;
  const [expanded, setExpanded] = React.useState<boolean>(level === 0);
  const checked = selectedIds.includes(node.id);

  return (
    <div className="animate-in fade-in-0 duration-150">
      <div className={`flex items-center ${getIndentationClass(level)}`}>
        {hasChildren ? (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mr-1 flex h-6 w-6 items-center justify-center rounded transition-colors duration-200 hover:bg-gray-100"
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
            {node.name}
          </span>
        </label>
      </div>

      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="pl-6">
            {node.children!.map(child => (
              <CategoryTreeNode
                key={child.id}
                node={child}
                selectedIds={selectedIds}
                onToggle={onToggle}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
