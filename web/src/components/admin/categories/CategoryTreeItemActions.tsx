'use client';

import * as React from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import type { AdminCategoryNode } from '@/types/category';

type Props = {
  node: AdminCategoryNode;
  onCreateSubcategory?: (parentId: string) => void;
  onEdit?: (category: AdminCategoryNode) => void;
  onDelete?: (category: AdminCategoryNode) => void;
};

export function CategoryTreeItemActions({
  node,
  onCreateSubcategory,
  onEdit,
  onDelete,
}: Props) {
  return (
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
      {onDelete && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDelete(node);
          }}
          className="cursor-pointer rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-red-600"
          aria-label="Удалить"
          title="Удалить"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
