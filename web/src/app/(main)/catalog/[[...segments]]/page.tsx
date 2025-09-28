'use client';

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import ProductFilters from '@/components/product/ProductFilters';
import TopFiltersBar from '@/components/product/TopFiltersBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { useCatalogPage } from '@/hooks/useCatalogPage';

export default function CatalogPage() {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            gridCols={gridCols}
            onGridColsChange={handleGridColsChange}
            onClearFilters={clearFilters}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="hidden lg:block">
              <ProductFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>

            {/* Mobile Filters */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <AdjustmentsHorizontalIcon className="mr-2 h-4 w-4" />
                    Фильтры
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <div className="mt-6">
                    <ProductFilters
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
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
    </div>
  );
}
