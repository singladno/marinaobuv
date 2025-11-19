import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface UseScrollToProductOptions {
  loading: boolean;
  productsLength: number;
  loadingMore: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  targetPath: string | RegExp; // Path pattern to match (e.g., '/' or '/catalog')
}

export function useScrollToProduct({
  loading,
  productsLength,
  loadingMore,
  hasNextPage,
  loadMore,
  targetPath,
}: UseScrollToProductOptions) {
  const pathname = usePathname();
  const targetProductIdRef = useRef<string | null>(null);
  const scrollCompletedRef = useRef(false);
  const maxScrollAttemptsRef = useRef(0);
  const lastCheckedProductsLengthRef = useRef(0);
  const [isSearching, setIsSearching] = useState(false);

  // Scroll to product when returning from product page
  useEffect(() => {
    // Don't attempt if still loading initial data
    if (loading || !productsLength) return;
    // Don't attempt if currently loading more (wait for it to finish)
    if (loadingMore) return;
    // Don't attempt if we've already completed scrolling for this navigation
    if (scrollCompletedRef.current) return;

    try {
      const navData = sessionStorage.getItem('productNavigation');
      if (!navData) {
        // Clear refs if no navigation data exists
        targetProductIdRef.current = null;
        scrollCompletedRef.current = false;
        maxScrollAttemptsRef.current = 0;
        lastCheckedProductsLengthRef.current = 0;
        return;
      }

      const { productId, referrer, timestamp } = JSON.parse(navData);
      if (!productId || !referrer) {
        sessionStorage.removeItem('productNavigation');
        return;
      }

      // Check if this is a page refresh (referrer is same as current page or empty)
      const currentUrl = window.location.href;
      if (!referrer || referrer === currentUrl || referrer === window.location.origin + window.location.pathname) {
        // This is a refresh, not navigation from product page
        sessionStorage.removeItem('productNavigation');
        return;
      }

      // Check if referrer is from a product page
      let referrerPath: string;
      try {
        const referrerUrl = referrer.startsWith('http')
          ? new URL(referrer)
          : new URL(referrer, window.location.origin);
        referrerPath = referrerUrl.pathname;
      } catch {
        referrerPath = referrer.split('?')[0];
      }

      // Only show banner if coming from product page (/product/...)
      const isFromProductPage = referrerPath.startsWith('/product/');

      if (!isFromProductPage) {
        // Not coming from product page, clear navigation data
        sessionStorage.removeItem('productNavigation');
        return;
      }

      // Check if navigation data is too old (more than 5 minutes) - likely a stale session
      if (timestamp && Date.now() - timestamp > 5 * 60 * 1000) {
        sessionStorage.removeItem('productNavigation');
        return;
      }

      // Set target product ID if not set
      if (!targetProductIdRef.current) {
        targetProductIdRef.current = productId;
        // Initialize to 0 so first check will detect new products
        lastCheckedProductsLengthRef.current = 0;
        setIsSearching(true);
      }

      // Only proceed if this is the target product
      if (targetProductIdRef.current !== productId) return;

      // Use the referrerPath we already calculated above
      const currentUrlObj = new URL(window.location.href);
      const currentPath = currentUrlObj.pathname + currentUrlObj.search;

      // Check if current path matches target path
      const pathMatches =
        typeof targetPath === 'string'
          ? currentPath === targetPath || currentPath.startsWith(`${targetPath}?`)
          : targetPath.test(currentPath);

      // Check if referrer path matches target path
      const referrerMatches =
        typeof targetPath === 'string'
          ? referrerPath === targetPath || referrerPath.startsWith(`${targetPath}?`)
          : targetPath.test(referrerPath);

      // Only scroll if we're on the target page and referrer matches
      // AND we're coming from a product page or edit modal
      if (pathMatches && referrerMatches) {
        // Find the product element
        const productElement = document.querySelector(
          `[data-product-id="${productId}"]`
        );

        if (productElement) {
          // Product is found, scroll to it
          scrollCompletedRef.current = true;
          setTimeout(() => {
            productElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            // Hide banner after scroll animation completes
            setTimeout(() => setIsSearching(false), 800);
          }, 100);

          // Clear the navigation data after scrolling
          sessionStorage.removeItem('productNavigation');
          targetProductIdRef.current = null;
          maxScrollAttemptsRef.current = 0;
          lastCheckedProductsLengthRef.current = 0;
        } else {
          // Product not found in current products
          // Check if we've already checked this set of products
          const hasAlreadyCheckedThisSet =
            lastCheckedProductsLengthRef.current === productsLength;

          if (!hasAlreadyCheckedThisSet) {
            // We have new products to check - mark them as checked
            lastCheckedProductsLengthRef.current = productsLength;

            // Since we just checked and didn't find it, try loading more
            // Limit attempts to prevent infinite loops
            if (hasNextPage && maxScrollAttemptsRef.current < 20) {
              maxScrollAttemptsRef.current += 1;
              // Load more products to find the target
              loadMore();
              // Don't set scrollCompleted - let the effect run again after loading
            } else {
              // Product not found after max attempts or no more pages
              scrollCompletedRef.current = true;
              setIsSearching(false);
              sessionStorage.removeItem('productNavigation');
              targetProductIdRef.current = null;
              maxScrollAttemptsRef.current = 0;
              lastCheckedProductsLengthRef.current = 0;
            }
          }
          // If we've already checked this set and product still not found,
          // wait for next load to complete (effect will re-run when productsLength changes)
        }
      }
    } catch (error) {
      // Silently fail if sessionStorage data is invalid
      console.error('Error scrolling to product:', error);
      sessionStorage.removeItem('productNavigation');
      scrollCompletedRef.current = true;
      setIsSearching(false);
      targetProductIdRef.current = null;
      maxScrollAttemptsRef.current = 0;
      lastCheckedProductsLengthRef.current = 0;
    }
  }, [
    loading,
    productsLength,
    loadingMore,
    hasNextPage,
    loadMore,
    pathname,
    targetPath,
  ]);

  // Reset scroll state when pathname changes (user navigates away and back)
  useEffect(() => {
    scrollCompletedRef.current = false;
    setIsSearching(false);
    targetProductIdRef.current = null;
    maxScrollAttemptsRef.current = 0;
    lastCheckedProductsLengthRef.current = 0;
  }, [pathname]);

  return { isSearching };
}
