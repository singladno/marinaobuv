'use client';

import { useMemo, useState } from 'react';

import ColorFilter from '@/components/product/filters/ColorFilter';
import PriceControl from '@/components/product/filters/PriceControl';
import { SortControl } from '@/components/catalog/SortControl';
import CategoryNavigationControl from '@/components/catalog/CategoryNavigationControl';
import CategoryFilterControl from '@/components/catalog/CategoryFilterControl';

interface CatalogFilters {
  search: string;
  categoryId: string;
  sortBy: string;
  minPrice?: number;
  maxPrice?: number;
  colors: string[];
  inStock: boolean;
  page: number;
  pageSize: number;
}

type TopFiltersBarBackendProps = {
  filters: CatalogFilters;
  onChange?: (filters: Partial<CatalogFilters>) => void;
  onClear?: () => void;
  // The base category id from the current page context; used to revert when subcategory is cleared
  baseCategoryId?: string;
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
  currentPath?: string;
  currentCategoryName?: string;
};

export default function TopFiltersBarBackend({
  filters,
  onChange,
  onClear,
  baseCategoryId,
  subcategories,
  siblingCategories,
  parentChildren,
  parentCategory,
  currentPath,
  currentCategoryName,
}: TopFiltersBarBackendProps) {
  // State for selected subcategories
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );

  const hasActive = useMemo(() => {
    // Check if there are any user-applied filters (excluding the base category context)
    const hasUserAppliedFilters =
      (filters.minPrice !== undefined && filters.minPrice > 0) ||
      (filters.maxPrice !== undefined && filters.maxPrice < 100000) ||
      filters.colors.length > 0 ||
      filters.inStock ||
      filters.search.length > 0;

    // Also check if there are selected subcategories that differ from the current path
    const hasSubcategorySelection = selectedSubcategories.length > 0;

    return hasUserAppliedFilters || hasSubcategorySelection;
  }, [filters, selectedSubcategories]);

  // Convert backend filters to frontend format
  const frontendFilters = useMemo(
    () => ({
      priceRange: [filters.minPrice ?? 0, filters.maxPrice ?? 100000] as [
        number,
        number,
      ],
      colors: filters.colors,
      inStock: filters.inStock,
      sortBy: filters.sortBy,
    }),
    [filters]
  );

  const handleFiltersChange = (newFilters: any) => {
    if (!onChange) return; // Don't do anything if no onChange handler

    const updatedFilters: Partial<CatalogFilters> = {};

    if (newFilters.priceRange !== undefined) {
      updatedFilters.minPrice =
        newFilters.priceRange[0] > 0 ? newFilters.priceRange[0] : undefined;
      updatedFilters.maxPrice =
        newFilters.priceRange[1] < 100000
          ? newFilters.priceRange[1]
          : undefined;
    }

    if (newFilters.colors !== undefined) {
      updatedFilters.colors = newFilters.colors;
    }

    if (newFilters.inStock !== undefined) {
      updatedFilters.inStock = newFilters.inStock;
    }

    if (newFilters.sortBy !== undefined) {
      updatedFilters.sortBy = newFilters.sortBy;
    }

    onChange(updatedFilters);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {/* Sort control */}
      <SortControl
        value={filters.sortBy}
        onChange={sortBy => onChange && onChange({ sortBy })}
      />

      {/* Category Navigation Control - Subcategories of current category */}
      {subcategories && subcategories.length > 0 && currentCategoryName && (
        <CategoryNavigationControl
          currentCategory={currentCategoryName}
          categories={subcategories}
          parentCategory={parentCategory || undefined}
          siblingCategories={siblingCategories}
          parentChildren={parentChildren}
        />
      )}

      {/* Category Filter Control - Subcategories */}
      {subcategories && subcategories.length > 0 && (
        <CategoryFilterControl
          selectedCategories={selectedSubcategories}
          categories={subcategories}
          onSelectionChange={categoryIds => {
            console.log(
              '🔍 TopFiltersBarBackend: Selection changed to:',
              categoryIds
            );
            setSelectedSubcategories(categoryIds);
            if (onChange) {
              onChange({
                categoryId:
                  categoryIds.length > 0
                    ? categoryIds[0]
                    : baseCategoryId || '',
              });
            }
          }}
          onClear={() => {
            console.log('🔍 TopFiltersBarBackend: Clearing selection');
            setSelectedSubcategories([]);
            if (onChange) {
              onChange({ categoryId: baseCategoryId || '' });
            }
          }}
        />
      )}

      {/* Price filter */}
      <PriceControl
        value={frontendFilters.priceRange}
        onChange={range => handleFiltersChange({ priceRange: range })}
      />

      {/* Color filter */}
      <ColorFilter
        value={frontendFilters.colors}
        onChange={colors => handleFiltersChange({ colors })}
        categoryId={filters.categoryId}
      />

      {/* Clear button */}
      {hasActive && onClear && (
        <button
          onClick={() => onClear()}
          className="h-9 rounded-xl px-3 text-sm text-gray-600 hover:bg-gray-100"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
