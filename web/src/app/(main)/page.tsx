'use client';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import TopFiltersBar from '@/components/product/TopFiltersBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useCatalogPage } from '@/hooks/useCatalogPage';

export default function Home() {
  const {
    products,
    loading,
    error,
    searchQuery,
    filters,
    gridCols,
    handleSearch,
    handleFiltersChange,
    handleGridColsChange,
    clearFilters,
  } = useCatalogPage();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Text variant="h2" className="mb-4">
            Ошибка загрузки каталога
          </Text>
          <Text className="text-muted-foreground mb-4">{error}</Text>
          <Button onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
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
          <TopFiltersBar
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
                Найдено товаров: {products.length}
              </Text>
              {searchQuery && (
                <Badge variant="secondary">
                  Поиск: &quot;{searchQuery}&quot;
                </Badge>
              )}
            </div>
          </div>

          {/* Products */}
          <ProductGrid
            products={products}
            gridCols={gridCols}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
