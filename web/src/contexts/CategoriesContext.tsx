'use client';

import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';

interface CategoriesContextValue {
  categories: CategoryNode[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const CategoriesContext = React.createContext<
  CategoriesContextValue | undefined
>(undefined);

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] = React.useState<CategoryNode[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/categories/tree');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const value = React.useMemo(
    () => ({
      categories,
      loading,
      error,
      reload: fetchCategories,
    }),
    [categories, loading, error, fetchCategories]
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoriesContextValue {
  const context = React.useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}
