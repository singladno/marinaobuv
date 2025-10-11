'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

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

// Global cache for all categories
let globalCategoryLookup: CategoryLookup = {};
let isLoaded = false;
let loadingPromise: Promise<void> | null = null;

export function CategoryLookupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lookup, setLookup] = useState<CategoryLookup>(globalCategoryLookup);
  const [isLoading, setIsLoading] = useState(!isLoaded);

  const refreshCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories/all');
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.items) {
          // Build lookup table from the tree
          const buildLookup = (categories: any[]): CategoryLookup => {
            const lookup: CategoryLookup = {};

            const processCategory = (category: any) => {
              lookup[category.id] = category.name;
              if (category.children) {
                Object.assign(lookup, buildLookup(category.children));
              }
            };

            categories.forEach(processCategory);
            return lookup;
          };

          const newLookup = buildLookup(data.items);
          globalCategoryLookup = newLookup;
          isLoaded = true;
          setLookup(globalCategoryLookup);
        }
      }
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      setLookup(globalCategoryLookup);
      setIsLoading(false);
      return;
    }

    if (loadingPromise) {
      loadingPromise.then(() => {
        setLookup(globalCategoryLookup);
        setIsLoading(false);
      });
      return;
    }

    // Fetch all categories once
    loadingPromise = fetchAllCategories();
    loadingPromise.then(() => {
      setLookup(globalCategoryLookup);
      setIsLoading(false);
    });
  }, []);

  const getCategoryName = (
    categoryId: string | null | undefined
  ): string | null => {
    if (!categoryId) return null;
    return (
      globalCategoryLookup[categoryId] ||
      `Category ${categoryId.substring(0, 8)}...`
    );
  };

  const value = {
    getCategoryName,
    isLoading,
    refreshCategories,
  };

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

async function fetchAllCategories(): Promise<void> {
  try {
    const response = await fetch('/api/categories/all');
    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.items) {
        // Build lookup table from the tree
        const buildLookup = (categories: any[]): CategoryLookup => {
          const lookup: CategoryLookup = {};

          const processCategory = (category: any) => {
            lookup[category.id] = category.name;
            if (category.children) {
              Object.assign(lookup, buildLookup(category.children));
            }
          };

          categories.forEach(processCategory);
          return lookup;
        };

        globalCategoryLookup = buildLookup(data.items);
        isLoaded = true;
      } else {
        console.error('Failed to fetch categories:', data.error);
      }
    } else {
      console.error('Failed to fetch categories:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}
