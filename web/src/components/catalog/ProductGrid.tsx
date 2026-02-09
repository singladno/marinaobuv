import { memo, useRef, useMemo } from 'react';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { ProductGridFooter } from './ProductGridFooter';
import { ProductGridEmpty } from './ProductGridEmpty';

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
  source?: 'WA' | 'AG' | 'MANUAL';
  sourceScreenshotUrl?: string | null;
  isActive?: boolean;
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
  showEndMessage?: boolean;
  onProductUpdated?: (updatedProduct?: any) => void;
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
  showEndMessage = true,
  onProductUpdated,
}: ProductGridProps) {
  // Track if we've ever completed a request (not just initial state)
  const hasCompletedRequestRef = useRef(false);

  // Deduplicate products by ID to prevent duplicate keys
  const uniqueProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      if (product.id && !acc.find(p => p.id === product.id)) {
        acc.push(product);
      }
      return acc;
    }, [] as Product[]);
  }, [products]);

  // Update hasCompletedRequestRef when loading finishes
  if (loading === false && products.length > 0) {
    hasCompletedRequestRef.current = true;
  }

  // Determine how many items to show (products or skeletons)
  const hasProducts = uniqueProducts.length > 0;
  const shouldShowSkeletons =
    !hasProducts && loading && !hasCompletedRequestRef.current;
  const itemCount = shouldShowSkeletons ? 8 : uniqueProducts.length;

  // Calculate items to render - must be before any early returns
  const itemsToRender: Array<Product & { isSkeleton?: boolean }> = useMemo(() => {
    if (shouldShowSkeletons) {
      return Array.from({ length: itemCount }).map((_, i) => ({
        id: `skeleton-${i}`,
        slug: '',
        name: '',
        pricePair: 0,
        primaryImageUrl: null,
        category: null,
        isSkeleton: true,
      })) as Array<Product & { isSkeleton?: boolean }>;
    }
    return uniqueProducts.map(p => ({
      ...p,
      isSkeleton: false,
    }));
  }, [shouldShowSkeletons, itemCount, uniqueProducts]);

  const gridClasses = {
    4: 'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch',
    5: 'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-stretch',
  };

  // Show empty state after a request has completed with no products
  if (products.length === 0 && hasCompletedRequestRef.current) {
    return <ProductGridEmpty />;
  }

  return (
    <>
      <div className={gridClasses[gridCols]}>
        {itemsToRender.map((item, index) => {
          if (item.isSkeleton) {
            return (
              <ProductCardSkeleton
                key={`skeleton-${index}`}
              />
            );
          }

          return (
            <ProductCard
              key={item.id || `grid-item-${index}`}
              slug={item.slug}
              name={item.name}
              pricePair={item.pricePair}
              currency="RUB"
              imageUrl={item.primaryImageUrl}
              videos={(item as any).videos}
              category={item.category?.name ?? undefined}
              colorOptions={item.colorOptions}
              productId={item.id}
              activeUpdatedAt={item.activeUpdatedAt ?? undefined}
              source={item.source ?? undefined}
              sourceScreenshotUrl={item.sourceScreenshotUrl ?? undefined}
              isActive={item.isActive ?? true}
              onProductUpdated={onProductUpdated}
              priority={index < 4}
            />
          );
        })}
      </div>

      <ProductGridFooter
        hasNextPage={hasNextPage}
        loadingMore={loadingMore}
        error={error ?? null}
        onRetry={onRetry}
        loadMoreRef={loadMoreRef}
        showEndMessage={showEndMessage}
        totalProducts={uniqueProducts.length}
      />
    </>
  );
});
