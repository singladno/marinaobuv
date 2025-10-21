import ProductCard from '@/components/product/ProductCard';

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
}

export function ProductGrid({ products, gridCols, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-64 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
            <div className="mt-4 space-y-2">
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
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

  return (
    <div className={gridClasses[gridCols]}>
      {products.map(product => (
        <ProductCard
          key={product.id}
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
  );
}
