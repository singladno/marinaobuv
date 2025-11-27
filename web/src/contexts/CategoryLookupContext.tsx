'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
} from 'react';
import { useCategories } from '@/contexts/CategoriesContext';

interface CategoryLookup {
  [id: string]: string;
}

interface CategoryLookupContextValue {
  getCategoryName: (categoryId: string | null | undefined) => string | null;
  isLoading: boolean;
  refreshCategories: () => Promise<void>;
}

const CategoryLookupContext = createContext<
  CategoryLookupContextValue | undefined
>(undefined);

/**
 * Builds a lookup table from category tree
 */
function buildLookup(categories: any[]): CategoryLookup {
  const lookup: CategoryLookup = {};

  const processCategory = (category: any) => {
    lookup[category.id] = category.name;
    if (category.children) {
      Object.assign(lookup, buildLookup(category.children));
    }
  };

  categories.forEach(processCategory);
  return lookup;
}

export function CategoryLookupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use CategoriesContext instead of fetching separately
  const { categories, loading, reload } = useCategories();

  // Build lookup table from categories whenever they change
  const lookup = useMemo(() => {
    if (categories.length === 0) {
      return {};
    }
    return buildLookup(categories);
  }, [categories]);

  const getCategoryName = useCallback(
    (categoryId: string | null | undefined): string | null => {
      if (!categoryId) return null;
      return (
        lookup[categoryId] || `Category ${categoryId.substring(0, 8)}...`
      );
    },
    [lookup]
  );

  const refreshCategories = useCallback(async (): Promise<void> => {
    await reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      getCategoryName,
      isLoading: loading,
      refreshCategories,
    }),
    [getCategoryName, loading, refreshCategories]
  );

  return (
    <CategoryLookupContext.Provider value={value}>
      {children}
    </CategoryLookupContext.Provider>
  );
}

export function useCategoryLookupContext(): CategoryLookupContextValue {
  const context = useContext(CategoryLookupContext);
  if (context === undefined) {
    throw new Error(
      'useCategoryLookupContext must be used within a CategoryLookupProvider'
    );
  }
  return context;
}
