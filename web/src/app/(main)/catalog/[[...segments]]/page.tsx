'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useParams, usePathname } from 'next/navigation';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import { log } from '@/lib/logger';
import GridColsSwitcher from '@/components/catalog/GridColsSwitcher';
import TopFiltersBarBackend from '@/components/catalog/TopFiltersBarBackend';
import CategoryBreadcrumbs from '@/components/catalog/CategoryBreadcrumbs';
import { Text } from '@/components/ui/Text';
import { useCatalogBackend } from '@/hooks/useCatalogBackend';
import { useSearch } from '@/contexts/SearchContext';
import CatalogPagination from '@/components/ui/CatalogPagination';
import ScrollArrows from '@/components/ui/ScrollArrows';
import {
  loadPersistedCatalogFilters,
  usePersistCatalogFilters,
} from '@/hooks/usePersistedCatalogFilters';

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
    error,
    pagination,
    filters,
    handleFiltersChange,
    handleSortChange,
    handlePageChange,
    clearFilters,
    updateProduct: updateProductOptimistic,
  } = useCatalogBackend({ skipInitialFetch: true });

  const pathname = usePathname();

  // Grid columns state for switcher (4 or 5)
  const [gridCols, setGridCols] = useState<4 | 5>(4);
  // Enable persisting only after we attempt to restore
  const [canPersist, setCanPersist] = useState(false);
  // Ensure we restore saved filters before category sync/fetch
  const [restored, setRestored] = useState(false);
  // Hold saved filters until category is known to avoid double fetch
  const [savedFilters, setSavedFilters] = useState<any | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const initialFetchDoneRef = useRef(false);
  const initMergedRef = useRef(false);
  const savedFiltersRef = useRef<any | null>(null);

  // On mount: disable native scroll restoration to avoid browser jump fighting our own
  useEffect(() => {
    const prev = history.scrollRestoration;
    try {
      history.scrollRestoration = 'manual';
      log.info('🧭 scrollRestoration set to manual');
    } catch {}
    return () => {
      try {
        history.scrollRestoration = prev;
        log.info('🧭 scrollRestoration restored');
      } catch {}
    };
  }, []);

  // Fetch category information when category path changes (after restore)
  useEffect(() => {
    const fetchCategory = async () => {
      console.log('🔍 Fetching category for path:', categoryPath);
      if (!categoryPath) {
        setCategoryId('');
        setCategoryName('');
        // If no category path, trigger initial fetch once using saved filters
        if (
          restored &&
          savedFiltersRef.current &&
          !initialFetchDoneRef.current
        ) {
          initialFetchDoneRef.current = true;
          setInitialFetchDone(true);
          log.info('🚀 Initial catalog fetch (no category path)', {
            savedFilters: savedFiltersRef.current,
          });
          handleFiltersChange(savedFiltersRef.current);
        }
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
          // Perform single initial fetch combining saved filters + category id
          if (
            restored &&
            savedFiltersRef.current &&
            !initialFetchDoneRef.current
          ) {
            initialFetchDoneRef.current = true;
            setInitialFetchDone(true);
            log.info('🚀 Initial catalog fetch (with category)', {
              categoryId: data.id,
              savedFilters: savedFiltersRef.current,
            });
            handleFiltersChange({
              ...savedFiltersRef.current,
              categoryId: data.id,
            });
          }
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

    if (restored) fetchCategory();
  }, [categoryPath, restored]);

  // Load saved filters and merge with URL params ONLY ONCE before initial fetch
  useEffect(() => {
    if (!pathname || initMergedRef.current) return;
    initMergedRef.current = true;
    const saved = loadPersistedCatalogFilters(pathname);

    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const pageSizeParam = parseInt(searchParams.get('pageSize') || '20', 10);
    const searchParam = searchParams.get('search');

    const merged = {
      ...(saved || {}),
      page: pageParam,
      pageSize: pageSizeParam,
      ...(searchParam && { search: searchParam }),
    };

    log.info('📦 Restored filters (merged with URL)', merged);
    if (searchParam) setSearchQuery(searchParam);
    setSavedFilters(merged);
    savedFiltersRef.current = merged;
    setCanPersist(true);
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, setSearchQuery]);

  // Persist filters whenever they change, scoped by current pathname
  usePersistCatalogFilters(
    pathname,
    {
      search: filters.search,
      sortBy: filters.sortBy,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      colors: filters.colors,
      inStock: filters.inStock,
      page: filters.page,
      pageSize: filters.pageSize,
    },
    { enabled: canPersist }
  );

  // React to URL page/pageSize changes after initial fetch
  const prevSearchParamsRef = useRef<string>('');
  useEffect(() => {
    // Skip during initial load
    if (!restored || !initialFetchDone) {
      // Store initial searchParams to compare later
      prevSearchParamsRef.current = searchParams.toString();
      return;
    }

    const currentParams = searchParams.toString();
    // Skip if params haven't actually changed (prevents duplicate calls)
    if (currentParams === prevSearchParamsRef.current) return;
    prevSearchParamsRef.current = currentParams;

    const pageParam = parseInt(
      searchParams.get('page') || String(filters.page),
      10
    );
    const pageSizeParam = parseInt(
      searchParams.get('pageSize') || String(filters.pageSize),
      10
    );
    if (pageParam !== filters.page || pageSizeParam !== filters.pageSize) {
      handleFiltersChange({ page: pageParam, pageSize: pageSizeParam });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams,
    restored,
    initialFetchDone,
    filters.page,
    filters.pageSize,
  ]);

  // Show a single skeleton while either category or products are loading
  if (categoryLoading || (loading && products.length === 0)) {
    return <CatalogPageFallback />;
  }

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
      <div className="container mx-auto px-4 pb-12 pt-8">
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
            baseCategoryId={categoryId}
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
          <div className="hidden lg:block">
            <GridColsSwitcher value={gridCols} onChange={setGridCols} />
          </div>
        </div>

        {/* Products */}
        <div className="w-full">
          <ProductGrid
            products={products}
            gridCols={gridCols}
            loading={loading}
            hasNextPage={false}
            error={error}
            showEndMessage={false}
            onProductUpdated={updatedProduct => {
              // Update the product optimistically without refetching
              if (updatedProduct) {
                // Map API product to catalog format
                // Find primary image (isPrimary: true) or first image sorted by isPrimary desc, sort asc
                const sortedImages =
                  updatedProduct.images
                    ?.filter((img: any) => img.isActive !== false)
                    .sort((a: any, b: any) => {
                      // Primary images first
                      if (a.isPrimary && !b.isPrimary) return -1;
                      if (!a.isPrimary && b.isPrimary) return 1;
                      // Then by sort order
                      return (a.sort || 0) - (b.sort || 0);
                    }) || [];

                const primaryImageUrl = sortedImages[0]?.url || null;

                // Deduplicate colorOptions by color (same as API does)
                const seen = new Set<string>();
                const colorOptions =
                  updatedProduct.images
                    ?.filter((img: any) => img.color)
                    .filter((img: any) => {
                      const key = (img.color || '').toLowerCase();
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    })
                    .map((img: any) => ({
                      color: img.color,
                      imageUrl: img.url,
                    })) || [];

                const catalogProduct = {
                  ...updatedProduct,
                  primaryImageUrl,
                  colorOptions,
                };

                updateProductOptimistic(updatedProduct.id, catalogProduct);
              }
            }}
          />
        </div>

        {/* Pagination */}
        <CatalogPagination
          basePath={pathname}
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          filters={filters}
          categoryId={categoryId || undefined}
        />
      </div>
      <ScrollArrows offsetBottomPx={28} />
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
