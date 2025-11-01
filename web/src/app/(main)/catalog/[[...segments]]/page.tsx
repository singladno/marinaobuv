'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams, usePathname } from 'next/navigation';

import { ProductGrid } from '@/components/catalog/ProductGrid';
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
  } = useCatalogBackend({ skipInitialFetch: true });

  const pathname = usePathname();

  // Grid columns state for switcher (4 or 5)
  const [gridCols, setGridCols] = useState<4 | 5>(4);
  // Enable persisting only after we attempt to restore
  const [canPersist, setCanPersist] = useState(false);
  // Ensure we restore saved filters before category sync/fetch
  const [restored, setRestored] = useState(false);

  // Fetch category information when category path changes (after restore)
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
          // sync filters with category (after restore applied)
          handleFiltersChange({ categoryId: data.id });
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

  // Load saved filters for this specific catalog path (per-device persistence)
  useEffect(() => {
    if (!pathname) return;
    const saved = loadPersistedCatalogFilters(pathname);
    if (saved) {
      // Do not set categoryId here; it's handled via category fetch above
      handleFiltersChange(saved);
    }
    setCanPersist(true);
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Initialize search query from URL parameters
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const pageSizeParam = parseInt(searchParams.get('pageSize') || '20', 10);
    if (pageParam !== filters.page || pageSizeParam !== filters.pageSize) {
      handleFiltersChange({ page: pageParam, pageSize: pageSizeParam });
    }
  }, [
    searchParams,
    setSearchQuery,
    handleFiltersChange,
    filters.page,
    filters.pageSize,
  ]);

  // Persist filters whenever they change, scoped by current pathname
  usePersistCatalogFilters(pathname, {
    search: filters.search,
    sortBy: filters.sortBy,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    colors: filters.colors,
    inStock: filters.inStock,
    page: filters.page,
    pageSize: filters.pageSize,
  }, { enabled: canPersist });

  // Scroll to product when returning from product page
  useEffect(() => {
    if (loading || !products.length) return;

    try {
      const navData = sessionStorage.getItem('productNavigation');
      if (!navData) return;

      const { productId, referrer } = JSON.parse(navData);
      if (!productId || !referrer) return;

      // Normalize referrer URL (handle both full URLs and relative paths)
      let referrerPath: string;
      try {
        const referrerUrl = referrer.startsWith('http')
          ? new URL(referrer)
          : new URL(referrer, window.location.origin);
        referrerPath = referrerUrl.pathname + referrerUrl.search;
      } catch {
        // If referrer is not a valid URL, try treating it as a path
        referrerPath = referrer.split('?')[0] + (referrer.includes('?') ? '?' + referrer.split('?')[1] : '');
      }

      const currentUrl = new URL(window.location.href);
      const currentPath = currentUrl.pathname + currentUrl.search;

      // Only scroll if we're on a catalog page that matches the referrer
      // Check both /catalog and /catalog/... paths
      if ((currentPath === '/catalog' || currentPath.startsWith('/catalog/')) && referrerPath === currentPath) {
        // Find the product element
        const productElement = document.querySelector(
          `[data-product-id="${productId}"]`
        );

        if (productElement) {
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            productElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }, 100);

          // Clear the navigation data after scrolling
          sessionStorage.removeItem('productNavigation');
        }
      }
    } catch (error) {
      // Silently fail if sessionStorage data is invalid
      console.error('Error scrolling to product:', error);
      sessionStorage.removeItem('productNavigation');
    }
  }, [loading, products.length]);

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
      <div className="container mx-auto px-4 pt-8 pb-12">
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
