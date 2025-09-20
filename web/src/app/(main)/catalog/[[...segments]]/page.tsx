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
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/Sheet';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters, {
  FilterOptions,
} from '@/components/product/ProductFilters';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';

export default function CatalogPage() {
  const { products, loading, error } = useCatalogProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, 50000],
    minRating: 0,
    inStock: false,
    sortBy: 'featured',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
          !product.category?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Category filter
      if (
        filters.categories.length > 0 &&
        product.category &&
        !filters.categories.includes(product.category)
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
      priceRange: [0, 50000],
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
    filters.priceRange[1] < 50000 ||
    filters.minRating > 0 ||
    filters.inStock ||
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Text variant="h1" as="h1" className="mb-4 text-3xl font-bold">
            Каталог обуви
          </Text>

          {/* Search and View Controls */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="max-w-md flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  type="search"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center rounded-md border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <ListBulletIcon className="h-4 w-4" />
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

          {/* Results Info */}
          <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
            <span>
              {filteredProducts.length} товар
              {filteredProducts.length !== 1 ? 'ов' : ''} найдено
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Очистить все фильтры
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-8">
              <ProductFilters
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {filteredProducts.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'space-y-4'
                }
              >
                {filteredProducts.map(product =>
                  viewMode === 'grid' ? (
                    <ProductCard
                      key={product.id}
                      slug={product.slug}
                      name={product.name}
                      pricePair={product.pricePair}
                      currency={product.currency}
                      imageUrl={product.primaryImageUrl}
                      category={product.category?.name || product.category}
                      showCategory={true}
                    />
                  ) : (
                    <Card key={product.id} className="hover-elevate p-4">
                      <div className="flex gap-4">
                        <div className="bg-muted h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
                          <img
                            src={
                              product.primaryImageUrl || '/images/demo/1.jpg'
                            }
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <Text variant="h3" className="font-semibold">
                                {product.name}
                              </Text>
                              <Text className="text-muted-foreground text-sm">
                                {product.category?.name || product.category}
                              </Text>
                            </div>
                            <div className="text-right">
                              <Text className="text-xl font-bold">
                                {product.pricePair.toLocaleString()} ₽
                              </Text>
                              <Badge
                                variant={
                                  product.isActive ? 'secondary' : 'outline'
                                }
                                className="mt-1"
                              >
                                {product.isActive
                                  ? 'В наличии'
                                  : 'Нет в наличии'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              disabled={!product.isActive}
                            >
                              В корзину
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleToggleWishlist(product.id)}
                            >
                              ❤️
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                )}
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
