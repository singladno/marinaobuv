'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/Sheet';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters, {
  FilterOptions,
} from '@/components/product/ProductFilters';
import TopFiltersBar from '@/components/product/TopFiltersBar';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';

export default function CatalogPage() {
  const { products, loading, error } = useCatalogProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, 100000],
    minRating: 0,
    inStock: false,
    sortBy: 'featured',
  });
  const [gridCols, setGridCols] = useState<4 | 5>(4);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let result = products.filter(product => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !product.name.toLowerCase().includes(query) &&
          !(product.category?.name || product.category)
            ?.toLowerCase()
            .includes(query)
        ) {
          return false;
        }
      }

      // Category filter
      if (
        filters.categories.length > 0 &&
        product.category &&
        !filters.categories.includes(product.category?.name || product.category)
      ) {
        return false;
      }

      // Price range filter
      if (
        product.pricePair < filters.priceRange[0] ||
        product.pricePair > filters.priceRange[1]
      ) {
        return false;
      }

      // Stock filter
      if (filters.inStock && !product.isActive) {
        return false;
      }

      return true;
    });

    // Sort products
    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.pricePair - b.pricePair);
        break;
      case 'price-high':
        result.sort((a, b) => b.pricePair - a.pricePair);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default: // featured
        break;
    }

    return result;
  }, [products, searchQuery, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 100000],
      minRating: 0,
      inStock: false,
      sortBy: 'featured',
    });
    setSearchQuery('');
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const newWishlist = new Set(prev);
      if (newWishlist.has(productId)) {
        newWishlist.delete(productId);
      } else {
        newWishlist.add(productId);
      }
      return newWishlist;
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 100000 ||
    filters.minRating > 0 ||
    searchQuery.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">⏳</div>
            <Text variant="h3" className="mb-2 text-xl font-semibold">
              Загрузка товаров...
            </Text>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">❌</div>
            <Text variant="h3" className="mb-2 text-xl font-semibold">
              Ошибка загрузки
            </Text>
            <Text className="text-muted-foreground">
              Не удалось загрузить товары. Попробуйте обновить страницу.
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-1 py-8">
        {/* Header */}
        <div className="mb-8">
          <Text variant="h1" as="h1" className="mb-4 text-3xl font-bold">
            Каталог обуви
          </Text>

          {/* Filters row with view switcher on the right */}
          <div className="flex items-center justify-between gap-4">
            <TopFiltersBar
              filters={filters}
              onChange={partial =>
                setFilters(prev => ({ ...prev, ...partial }))
              }
              onClear={handleClearFilters}
            />
            <div className="flex items-center gap-2">
              {/* Grid columns toggle: 4 or 5 per row */}
              <div className="flex items-center rounded-md border">
                <Button
                  variant={gridCols === 4 ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGridCols(4)}
                  aria-label="4 в ряд"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill={gridCols === 4 ? 'currentColor' : '#9CA3AF'}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0 12.727c0-1.004.814-1.818 1.818-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 7.273 20H1.818A1.818 1.818 0 0 1 0 18.182v-5.455Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636ZM0 1.818C0 .814.814 0 1.818 0h5.455C8.277 0 9.09.814 9.09 1.818v5.455A1.818 1.818 0 0 1 7.273 9.09H1.818A1.818 1.818 0 0 1 0 7.273V1.818Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91V2.728a.91.91 0 0 1 .91-.909h3.636ZM12.727 0a1.818 1.818 0 0 0-1.818 1.818v5.455c0 1.004.814 1.818 1.818 1.818h5.455A1.818 1.818 0 0 0 20 7.273V1.818A1.818 1.818 0 0 0 18.182 0h-5.455Zm5.455 2.727a.91.91 0 0 0-.91-.909h-3.636a.91.91 0 0 0-.909.91v3.636c0 .502.407.909.91.909h3.636a.91.91 0 0 0 .909-.91V2.728ZM10.91 12.727c0-1.004.813-1.818 1.817-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 18.182 20h-5.455a1.818 1.818 0 0 1-1.818-1.818v-5.455Zm6.363 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909h-3.636a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636Z"
                    />
                  </svg>
                </Button>
                <Button
                  variant={gridCols === 5 ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGridCols(5)}
                  aria-label="5 в ряд"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill={gridCols === 5 ? 'currentColor' : '#9CA3AF'}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4h-2.2ZM15 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-4ZM15.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4h-2.2ZM15 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-4ZM15.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4h-2.2ZM15 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4ZM8.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H8.9ZM8 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H8ZM1.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H1.9ZM1 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H1ZM1.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H1.9ZM1 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1ZM8.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H8.9ZM8 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8ZM8.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H8.9ZM8 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H8ZM1.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H1.9ZM1 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1Z"
                    />
                  </svg>
                </Button>
              </div>

              {/* Mobile Filter Toggle */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 lg:hidden"
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                    Фильтры
                    {hasActiveFilters && (
                      <Badge
                        variant="secondary"
                        className="h-5 w-5 p-0 text-xs"
                      >
                        !
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <ProductFilters
                    onFiltersChange={handleFiltersChange}
                    onClearFilters={handleClearFilters}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar removed in favor of top filters */}

          {/* Products Grid */}
          <main className="flex-1">
            {filteredProducts.length > 0 ? (
              <div
                className={
                  gridCols === 5
                    ? 'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }
              >
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    slug={product.slug}
                    name={product.name}
                    pricePair={product.pricePair}
                    currency={product.currency}
                    imageUrl={product.primaryImageUrl}
                    category={product.category?.name || product.category}
                    showCategory={true}
                    colorOptions={product.colorOptions}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">🔍</div>
                <Text variant="h3" className="mb-2 text-xl font-semibold">
                  Товары не найдены
                </Text>
                <Text className="text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'Попробуйте изменить фильтры или поисковый запрос'
                    : 'Товары временно недоступны'}
                </Text>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters}>
                    Очистить все фильтры
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
