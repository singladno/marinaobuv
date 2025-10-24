import { memo } from 'react';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from './ProductGridSkeleton';

interface Product {
  id: string;
  slug: string;
  name: string;
  pricePair: number;
  primaryImageUrl: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  colorOptions?: Array<{ color: string; imageUrl: string }>;
  activeUpdatedAt?: string;
}

interface ProductGridProps {
  products: Product[];
  gridCols: 4 | 5;
  loading: boolean;
  loadingMore?: boolean;
  hasNextPage?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  onRetry?: () => void;
  loadMoreRef?: (node: HTMLDivElement | null) => void;
}

export const ProductGrid = memo(function ProductGrid({
  products,
  gridCols,
  loading,
  loadingMore = false,
  hasNextPage = false,
  error,
  onLoadMore,
  onRetry,
  loadMoreRef,
}: ProductGridProps) {
  if (loading) {
    return <ProductGridSkeleton gridCols={gridCols} />;
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-gray-500">Товары не найдены</p>
        <p className="mt-2 text-sm text-gray-400">
          Попробуйте изменить параметры поиска или фильтры
        </p>
      </div>
    );
  }

  const gridClasses = {
    4: 'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  // Deduplicate products by ID to prevent duplicate keys
  const uniqueProducts = products.reduce((acc, product) => {
    if (!acc.find(p => p.id === product.id)) {
      acc.push(product);
    }
    return acc;
  }, [] as Product[]);

  return (
    <>
      <div className={gridClasses[gridCols]}>
        {uniqueProducts.map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            slug={product.slug}
            name={product.name}
            pricePair={product.pricePair}
            currency="RUB"
            imageUrl={product.primaryImageUrl}
            category={product.category?.name ?? undefined}
            colorOptions={product.colorOptions}
            productId={product.id}
            activeUpdatedAt={product.activeUpdatedAt}
          />
        ))}
      </div>

      {/* Infinite scroll trigger and loading indicator */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="mt-8 flex justify-center">
          {loadingMore ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Загрузка товаров...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-red-600">Ошибка загрузки</p>
              <button
                onClick={onRetry}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
              >
                Попробовать снова
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onLoadMore}
                className="rounded-lg bg-purple-600 px-6 py-2 text-white transition-colors hover:bg-purple-700"
              >
                Загрузить еще
              </button>
              <p className="text-xs text-gray-500">
                Или прокрутите вниз для автоматической загрузки
              </p>
            </div>
          )}
        </div>
      )}

      {/* End of results message */}
      {!hasNextPage && uniqueProducts.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Показаны все товары ({uniqueProducts.length})
          </p>
        </div>
      )}
    </>
  );
});
