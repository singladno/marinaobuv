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
      console.log('[useAllCategories] Starting fetch...');
      setLoading(true);
      setError(null);
      console.log('[useAllCategories] Fetching categories from /api/categories/all');
      const response = await fetch('/api/categories/all', {
        cache: 'no-cache',
      });
      console.log('[useAllCategories] Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch all categories');
      }
      const data = await response.json();
      console.log('[useAllCategories] Received data:', { itemsCount: data.items?.length || 0 });
      setCategories(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[useAllCategories] Error fetching all categories:', err);
    } finally {
      setLoading(false);
      console.log('[useAllCategories] Fetch completed, loading set to false');
    }
  }, []);

  React.useEffect(() => {
    console.log('[useAllCategories] useEffect triggered, calling fetchCategories');
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    reload: fetchCategories,
  };
}
