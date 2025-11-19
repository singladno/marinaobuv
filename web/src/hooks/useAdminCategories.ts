import * as React from 'react';

import type {
  AdminCategoryNode,
  FlatAdminCategory,
} from '@/types/category';

const flatten = (
  nodes: AdminCategoryNode[],
  depth = 0
): FlatAdminCategory[] => {
  return nodes.flatMap(node => [
    { ...node, depth },
    ...flatten(node.children || [], depth + 1),
  ]);
};

export function useAdminCategories() {
  const [tree, setTree] = React.useState<AdminCategoryNode[]>([]);
  const [flat, setFlat] = React.useState<FlatAdminCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/categories', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Не удалось загрузить категории');
      }

      const data = await response.json();
      const items: AdminCategoryNode[] = data.items ?? [];
      setTree(items);
      setFlat(flatten(items));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(message);
      console.error('[useAdminCategories] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    tree,
    flat,
    loading,
    error,
    reload: fetchCategories,
  };
}
