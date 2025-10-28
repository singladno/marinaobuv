'use client';

import { createContext, useContext, ReactNode, useState } from 'react';

interface CategoryData {
  subcategories?: Array<{
    id: string;
    name: string;
    path: string;
    href: string;
    hasChildren?: boolean;
  }>;
  siblingCategories?: Array<{
    id: string;
    name: string;
    path: string;
    href: string;
    hasChildren?: boolean;
  }>;
  parentChildren?: Array<{
    id: string;
    name: string;
    path: string;
    href: string;
    hasChildren?: boolean;
  }>;
  parentCategory?: {
    id: string;
    name: string;
    path: string;
    href: string;
  } | null;
  breadcrumbs?: any[];
}

interface CategoryDataContextType {
  categoryData: CategoryData | null;
  setCategoryData: (data: CategoryData | null) => void;
}

const CategoryDataContext = createContext<CategoryDataContextType | undefined>(undefined);

export function CategoryDataProvider({ children }: { children: ReactNode }) {
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);

  return (
    <CategoryDataContext.Provider value={{ categoryData, setCategoryData }}>
      {children}
    </CategoryDataContext.Provider>
  );
}

export function useCategoryData() {
  const context = useContext(CategoryDataContext);
  if (context === undefined) {
    throw new Error('useCategoryData must be used within a CategoryDataProvider');
  }
  return context;
}
