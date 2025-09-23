'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';

type SortBy =
  | 'added-desc'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { products, loading, error } = useCatalogProducts();
  const [sortBy, setSortBy] = useState<SortBy>('added-desc');
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
      case 'price-asc':
        arr.sort((a, b) => a.pricePair - b.pricePair);
        break;
      case 'price-desc':
        arr.sort((a, b) => b.pricePair - a.pricePair);
        break;
      case 'name-asc':
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
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
              <span className="text-muted-foreground text-sm">Сортировка:</span>
              <Select
                value={sortBy}
                onChange={v => setSortBy(v as SortBy)}
                options={[
                  { label: 'По дате добавления', value: 'added-desc' },
                  { label: 'Цена: по возрастанию', value: 'price-asc' },
                  { label: 'Цена: по убыванию', value: 'price-desc' },
                  { label: 'Название: A→Я', value: 'name-asc' },
                  { label: 'Название: Я→A', value: 'name-desc' },
                ]}
              />
            </div>

            <div className="w-full max-w-xs">
              <Input
                placeholder="Поиск в избранном..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
              <Link href="/catalog">Перейти в каталог</Link>
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
