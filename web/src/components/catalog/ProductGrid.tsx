import { memo, useRef, useEffect, useState } from 'react';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import { FlipCard } from './FlipCard';
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
  const prevLoadingRef = useRef(loading);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    const hadProducts = products.length > 0;
    prevLoadingRef.current = loading;

    // Mark as completed when loading finishes OR when products appear
    if (
      (wasLoading && !loading) ||
      (!hasCompletedRequestRef.current && hadProducts)
    ) {
      hasCompletedRequestRef.current = true;
      // Trigger animation when we have products
      if (hadProducts) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          setShouldAnimate(true);
        }, 50);
      }
    }

    // Reset animation when starting a new load
    if (loading && products.length === 0) {
      setShouldAnimate(false);
    }
  }, [loading, products.length]);

  const gridClasses = {
    4: 'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch',
    5: 'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-stretch',
  };

  // Deduplicate products by ID to prevent duplicate keys
  const uniqueProducts = products.reduce((acc, product) => {
    if (!acc.find(p => p.id === product.id)) {
      acc.push(product);
    }
    return acc;
  }, [] as Product[]);

  // Show empty state after a request has completed with no products
  if (products.length === 0 && hasCompletedRequestRef.current) {
    return <ProductGridEmpty />;
  }

  // Determine how many items to show (products or skeletons)
  // Priority: If we have products, always show them (even if loading)
  // Only show skeletons if we're loading AND have no products yet AND haven't completed a request
  const hasProducts = uniqueProducts.length > 0;
  const shouldShowSkeletons =
    !hasProducts && loading && !hasCompletedRequestRef.current;
  const itemCount = shouldShowSkeletons ? 8 : uniqueProducts.length;
  const itemsToRender: Array<Product & { isSkeleton?: boolean }> =
    shouldShowSkeletons
      ? Array.from({ length: itemCount }).map(
          (_, i) =>
            ({
              id: `skeleton-${i}`,
              slug: '',
              name: '',
              pricePair: 0,
              primaryImageUrl: null,
              category: null,
              isSkeleton: true,
            }) as Product & { isSkeleton: boolean }
        )
      : uniqueProducts.map(p => ({ ...p, isSkeleton: false }));

  return (
    <>
      <div className={gridClasses[gridCols]}>
        {itemsToRender.map((item, index) => (
          <FlipCard
            key={item.isSkeleton ? `grid-item-${index}` : `grid-item-${index}`}
            front={<ProductCardSkeleton />}
            back={
              item.isSkeleton ? (
                <ProductCardSkeleton />
              ) : (
                <ProductCard
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
                  isActive={item.isActive ?? true}
                  onProductUpdated={onProductUpdated}
                  priority={index < 4}
                />
              )
            }
            isFlipped={shouldAnimate && !item.isSkeleton}
            delay={item.isSkeleton ? 0 : index * 80}
          />
        ))}
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
