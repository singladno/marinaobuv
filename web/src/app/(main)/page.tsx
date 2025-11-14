'use client';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import GridColsSwitcher from '@/components/catalog/GridColsSwitcher';
import TopFiltersBarBackend from '@/components/catalog/TopFiltersBarBackend';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollToProductBanner } from '@/components/ui/ScrollToProductBanner';
import { Text } from '@/components/ui/Text';
import { useInfiniteCatalog } from '@/hooks/useInfiniteCatalog';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useScrollToProduct } from '@/hooks/useScrollToProduct';
import { useState } from 'react';

export default function Home() {
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
    fetchProducts,
  } = useInfiniteCatalog();

  // Set up infinite scroll
  const { setLoadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isLoading: loadingMore,
    onLoadMore: loadMore,
  });

  const [gridCols, setGridCols] = useState<4 | 5>(4);
  const { isSearching } = useScrollToProduct({
    loading,
    productsLength: products.length,
    loadingMore,
    hasNextPage,
    loadMore,
    targetPath: '/',
  });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Text variant="h2" className="mb-4">Ошибка загрузки каталога</Text>
          <Text className="text-muted-foreground mb-4">{error}</Text>
          <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <ScrollToProductBanner isVisible={isSearching} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Text variant="h1" as="h1" className="mb-2 text-3xl font-bold">
            Каталог товаров
          </Text>
          <Text className="text-muted-foreground">
            Найдите идеальную обувь для любого случая
          </Text>
        </div>

        {/* Top Filters Bar */}
        <div className="mb-6">
          <TopFiltersBarBackend
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
          />
        </div>

        {/* Products Grid */}
        <div className="w-full">
          {/* Results Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Text className="text-muted-foreground text-sm">
                Найдено товаров: {pagination.total}
              </Text>
              {filters.search && (
                <Badge variant="secondary">
                  Поиск: &quot;{filters.search}&quot;
                </Badge>
              )}
            </div>
            <div className="hidden lg:block">
              <GridColsSwitcher value={gridCols} onChange={setGridCols} />
            </div>
          </div>

          {/* Products */}
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
            onProductUpdated={() => fetchProducts()}
          />
        </div>
      </div>
    </div>
  );
}
