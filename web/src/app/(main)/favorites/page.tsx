'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import SortControl from '@/components/product/filters/SortControl';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/Text';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';

type SortBy =
  | 'featured'
  | 'price-low'
  | 'price-high'
  | 'name-asc'
  | 'name-desc';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { products, loading, error } = useCatalogProducts();
  const [sortBy, setSortBy] = useState<SortBy>('featured');
  const [search, setSearch] = useState('');

  const favoriteProducts = useMemo(() => {
    const base = products.filter(p => favorites.has(p.slug));
    const searched = search
      ? base.filter(
          p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.category?.name || '')
              .toLowerCase()
              .includes(search.toLowerCase())
        )
      : base;
    const arr = [...searched];
    switch (sortBy) {
      case 'price-low':
        arr.sort((a, b) => a.pricePair - b.pricePair);
        break;
      case 'price-high':
        arr.sort((a, b) => b.pricePair - a.pricePair);
        break;
      case 'name-asc':
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default: // featured
        arr.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return arr;
  }, [products, favorites, sortBy, search]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Text as="h1" className="text-2xl font-bold">
              Избранное
            </Text>
            <span className="text-muted-foreground text-sm">
              {favoriteProducts.length}
            </span>
          </div>

          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SortControl
                value={sortBy}
                onChange={v => setSortBy(v as SortBy)}
              />
            </div>

            <div className="w-full max-w-md">
              <SearchBar
                placeholder="Название, бренд, артикул, цвет"
                onSearch={q => setSearch(q)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">Загрузка…</div>
        ) : error ? (
          <div className="py-12 text-center">Ошибка: {error}</div>
        ) : favoriteProducts.length === 0 ? (
          <div className="py-12 text-center">
            <Text className="mb-3 text-lg">Избранное пусто</Text>
            <Button asChild>
              <Link href="/">Перейти в каталог</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteProducts.map(p => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                pricePair={p.pricePair}
                currency={p.currency}
                imageUrl={p.primaryImageUrl}
                category={p.category?.name || undefined}
                showCategory
                colorOptions={p.colorOptions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
