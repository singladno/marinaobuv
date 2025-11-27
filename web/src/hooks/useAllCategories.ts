import { useCategories } from '@/contexts/CategoriesContext';

interface UseAllCategoriesReturn {
  categories: ReturnType<typeof useCategories>['categories'];
  loading: ReturnType<typeof useCategories>['loading'];
  error: ReturnType<typeof useCategories>['error'];
  reload: ReturnType<typeof useCategories>['reload'];
}

/**
 * Hook to get all categories.
 * Uses CategoriesContext to avoid duplicate API calls.
 * This ensures only one request is made to /api/categories/all.
 */
export function useAllCategories(): UseAllCategoriesReturn {
  const { categories, loading, error, reload } = useCategories();

  return {
    categories,
    loading,
    error,
    reload,
  };
}
