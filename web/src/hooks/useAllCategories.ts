import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';

interface UseAllCategoriesReturn {
  categories: CategoryNode[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAllCategories(): UseAllCategoriesReturn {
  const [categories, setCategories] = React.useState<CategoryNode[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/categories/all');
      if (!response.ok) {
        throw new Error('Failed to fetch all categories');
      }
      const data = await response.json();
      setCategories(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching all categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    reload: fetchCategories,
  };
}
