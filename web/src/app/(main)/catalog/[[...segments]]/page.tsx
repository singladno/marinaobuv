'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import GridColsSwitcher from '@/components/catalog/GridColsSwitcher';
import TopFiltersBarBackend from '@/components/catalog/TopFiltersBarBackend';
import CategoryBreadcrumbs from '@/components/catalog/CategoryBreadcrumbs';
import { Text } from '@/components/ui/Text';
import { useInfiniteCatalog } from '@/hooks/useInfiniteCatalog';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useSearch } from '@/contexts/SearchContext';

function CatalogPageContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const { setSearchQuery } = useSearch();

  // Extract category path from URL segments
  const segments = params.segments as string[] | undefined;
  const categoryPath = segments ? segments.join('/') : undefined;

  // State for category info
  const [categoryId, setCategoryId] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isParentCategory, setIsParentCategory] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [siblingCategories, setSiblingCategories] = useState<any[]>([]);
  const [parentChildren, setParentChildren] = useState<any[]>([]);
  const [parentCategory, setParentCategory] = useState<{
    id: string;
    name: string;
    path: string;
    href: string;
  } | null>(null);

  const {
    products,
    loading,
    loadingMore,
    error,
    pagination,
    filters,
    hasNextPage,
    handleFiltersChange,
    handleSortChange,
    clearFilters,
    loadMore,
    retryLoadMore,
  } = useInfiniteCatalog(categoryId);

  // Set up infinite scroll
  const { setLoadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isLoading: loadingMore,
    onLoadMore: loadMore,
  });

  // Grid columns state for switcher (4 or 5)
  const [gridCols, setGridCols] = useState<4 | 5>(4);

  // Fetch category information when category path changes
  useEffect(() => {
    const fetchCategory = async () => {
      console.log('🔍 Fetching category for path:', categoryPath);
      if (!categoryPath) {
        setCategoryId('');
        setCategoryName('');
        return;
      }

      setCategoryLoading(true);
      try {
        const response = await fetch(
          `/api/categories/by-path?path=${encodeURIComponent(categoryPath)}`
        );
        const data = await response.json();

        console.log('🔍 Category API response:', data);
        if (data.ok) {
          setCategoryId(data.id);
          setCategoryName(data.name);
          setDisplayName(data.displayName || data.name);
          setBreadcrumbs(data.breadcrumbs || []);
          setSubcategories(data.subcategories || []);
          setSiblingCategories(data.siblingCategories || []);
          setParentChildren(data.parentChildren || []);
          setParentCategory(data.parentCategory || null);
          setIsParentCategory(data.isParentCategory || false);
          console.log(
            '🔍 Set categoryId:',
            data.id,
            'categoryName:',
            data.name,
            'displayName:',
            data.displayName,
            'subcategories:',
            data.subcategories?.length || 0
          );
        } else {
          setCategoryId('');
          setCategoryName('');
          setDisplayName('');
          setBreadcrumbs([]);
          setSubcategories([]);
          setSiblingCategories([]);
          setParentChildren([]);
          setIsParentCategory(false);
        }
      } catch (error) {
        console.error('Error fetching category:', error);
        setCategoryId('');
        setCategoryName('');
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategory();
  }, [categoryPath]);

  // Initialize search query from URL parameters
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams, setSearchQuery]);

  if (error) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Text className="text-red-500">
            Ошибка загрузки каталога: {error}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="mb-4">
              <CategoryBreadcrumbs items={breadcrumbs} />
            </div>
          )}

          <Text variant="h1" as="h1" className="mb-2 text-3xl font-bold">
            {displayName || categoryName || 'Каталог товаров'}
          </Text>

          {filters.search && (
            <Text className="text-muted-foreground">
              Результаты поиска по запросу: &ldquo;{filters.search}&rdquo;
            </Text>
          )}

          {isParentCategory && (
            <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <Text className="text-blue-700 dark:text-blue-300">
                Показаны товары из категории &ldquo;
                {displayName || categoryName}&rdquo;. Подкатегория &ldquo;
                {categoryPath?.split('/').pop()}&rdquo; не найдена.
              </Text>
            </div>
          )}

          {categoryLoading && (
            <Text className="text-muted-foreground">Загрузка категории...</Text>
          )}
        </div>

        {/* Top Filters Bar */}
        <div className="mb-6">
          <TopFiltersBarBackend
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
            subcategories={subcategories}
            siblingCategories={siblingCategories}
            parentChildren={parentChildren}
            parentCategory={parentCategory}
            currentPath={categoryPath}
            currentCategoryName={displayName || categoryName}
          />
        </div>

        {/* Results Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Text className="text-muted-foreground text-sm">
              Найдено товаров: {pagination.total}
            </Text>
          </div>
          <GridColsSwitcher value={gridCols} onChange={setGridCols} />
        </div>

        {/* Products */}
        <div className="w-full">
          <ProductGrid
            products={products}
            gridCols={gridCols}
            loading={loading}
            loadingMore={loadingMore}
            hasNextPage={hasNextPage}
            error={error}
            onLoadMore={loadMore}
            onRetry={retryLoadMore}
            loadMoreRef={setLoadMoreRef}
          />
        </div>
      </div>
    </div>
  );
}

function CatalogPageFallback() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="mb-4 h-6 w-64 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        </div>
        <div className="mb-6 h-16 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        <div className="mb-6 flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="h-8 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="h-4 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogPageFallback />}>
      <CatalogPageContent />
    </Suspense>
  );
}
