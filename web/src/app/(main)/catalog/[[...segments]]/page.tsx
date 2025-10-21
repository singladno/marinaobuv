'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import GridColsSwitcher from '@/components/catalog/GridColsSwitcher';
import TopFiltersBarBackend from '@/components/catalog/TopFiltersBarBackend';
import { Text } from '@/components/ui/Text';
import { useInfiniteCatalog } from '@/hooks/useInfiniteCatalog';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useSearch } from '@/contexts/SearchContext';

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const { setSearchQuery } = useSearch();
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
  } = useInfiniteCatalog();

  // Set up infinite scroll
  const { setLoadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isLoading: loadingMore,
    onLoadMore: loadMore,
  });

  // Grid columns state for switcher (4 or 5)
  const [gridCols, setGridCols] = useState<4 | 5>(4);

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
          <Text variant="h1" as="h1" className="mb-2 text-3xl font-bold">
            Каталог товаров
          </Text>
          {filters.search && (
            <Text className="text-muted-foreground">
              Результаты поиска по запросу: &ldquo;{filters.search}&rdquo;
            </Text>
          )}
        </div>

        {/* Top Filters Bar */}
        <div className="mb-6">
          <TopFiltersBarBackend
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
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
