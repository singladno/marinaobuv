'use client';

import * as React from 'react';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { AdminCategoryNode } from '@/types/category';

import { CategoryTreeList } from './CategoryTreeList';

type Props = {
  tree: AdminCategoryNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  error: string | null;
  onReload: () => Promise<void>;
  onCreateRoot?: () => void;
  onCreateSubcategory?: (parentId: string) => void;
  onEdit?: (category: AdminCategoryNode) => void;
  onDelete?: (category: AdminCategoryNode) => void;
};

const filterTree = (
  nodes: AdminCategoryNode[],
  term: string
): AdminCategoryNode[] => {
  if (!term.trim()) return nodes;
  const needle = term.toLowerCase();

  return nodes
    .map(node => {
      const matches =
        node.name.toLowerCase().includes(needle) ||
        node.urlPath.toLowerCase().includes(needle);
      const children = filterTree(node.children || [], term);
      if (matches || children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean) as AdminCategoryNode[];
};

export function CategoryTreePanel({
  tree,
  selectedId,
  onSelect,
  loading,
  error,
  onReload,
  onCreateRoot,
  onCreateSubcategory,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = React.useState('');
  const filtered = React.useMemo(
    () => filterTree(tree, search),
    [tree, search]
  );

  return (
    <Card className="h-full w-full min-w-0">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Дерево категорий
            </p>
            <p className="text-xs text-gray-500">
              Просматривайте структуру и выбирайте узлы.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => onReload()}
            disabled={loading}
          >
            <ArrowPathIcon className="h-4 w-4" />
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <Input
          placeholder="Поиск по названию или пути"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {onCreateRoot && (
          <div className="mb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={onCreateRoot}
            >
              <PlusIcon className="h-4 w-4" />
              Создать категорию в корне
            </Button>
          </div>
        )}
        <div className="max-h-[520px] overflow-y-auto overflow-x-hidden rounded-xl border border-gray-100 bg-white p-2">
          {loading ? (
            <p className="text-center text-sm text-gray-500">Загрузка...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Категории не найдены
            </p>
          ) : (
            <CategoryTreeList
              items={filtered}
              selectedId={selectedId}
              onSelect={onSelect}
              searchTerm={search}
              onCreateSubcategory={onCreateSubcategory}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
