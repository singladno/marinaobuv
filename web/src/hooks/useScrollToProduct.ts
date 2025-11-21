import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface UseScrollToProductOptions {
  loading: boolean;
  productsLength: number;
  loadingMore?: boolean; // Optional for pagination-based pages
  hasNextPage?: boolean; // Optional for pagination-based pages
  loadMore?: () => void; // Optional for pagination-based pages
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
    if (loading || !productsLength) {
      return;
    }
    // Don't attempt if currently loading more (wait for it to finish) - only if loadMore is available
    if (loadingMore) {
      return;
    }
    // Don't attempt if we've already completed scrolling for this navigation
    if (scrollCompletedRef.current) {
      return;
    }

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

      // Get current path
      const currentUrlObj = new URL(window.location.href);
      const currentPath = currentUrlObj.pathname;

      // Check if we're currently on a product page - if so, don't scroll (we just navigated TO the product)
      if (currentPath.startsWith('/product/')) {
        // We're on a product page, don't scroll yet - wait until we navigate away
        return;
      }

      // Check if navigation data is too old (more than 5 minutes) - likely a stale session
      if (timestamp && Date.now() - timestamp > 5 * 60 * 1000) {
        sessionStorage.removeItem('productNavigation');
        return;
      }

      // Parse referrer to get the path (this is the page we were on when we clicked the product)
      let referrerPath: string;
      try {
        const referrerUrl = referrer.startsWith('http')
          ? new URL(referrer)
          : new URL(referrer, window.location.origin);
        referrerPath = referrerUrl.pathname;
      } catch {
        referrerPath = referrer.split('?')[0];
      }

      // Check if current path matches target path pattern
      const currentPathWithSearch = currentUrlObj.pathname + currentUrlObj.search;
      const pathMatches =
        typeof targetPath === 'string'
          ? currentPathWithSearch === targetPath || currentPathWithSearch.startsWith(`${targetPath}?`) || currentPathWithSearch.startsWith(`${targetPath}/`)
          : targetPath.test(currentPathWithSearch);

      // Only proceed if we're on the target page
      // The referrer check is just for validation - we want to scroll if we're back on the page we came from
      if (!pathMatches) {
        // Not on target page, don't scroll
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

      // We've already verified pathMatches above, so proceed with scrolling
      // Find the product element
      const productElement = document.querySelector(
        `[data-product-id="${productId}"]`
      );

      if (productElement) {
        // Product is found, scroll to it
        // If the element is inside a FlipCard (absolutely positioned), scroll to the container instead
        const flipCardContainer = productElement.closest('.flip-card-container');
        const elementToScroll = flipCardContainer || productElement;

        scrollCompletedRef.current = true;
        setTimeout(() => {
          elementToScroll.scrollIntoView({
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

          // Since we just checked and didn't find it, try loading more (only if loadMore is available)
          // Limit attempts to prevent infinite loops
          if (loadMore && hasNextPage && maxScrollAttemptsRef.current < 20) {
            maxScrollAttemptsRef.current += 1;
            // Load more products to find the target
            loadMore();
            // Don't set scrollCompleted - let the effect run again after loading
          } else {
            // Product not found after max attempts, no more pages, or no loadMore function (pagination)
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

  // Reset scroll state when pathname changes, but only if we're not on a product page
  // This allows the scroll to happen when returning from a product page
  useEffect(() => {
    // Don't reset if we're on a product page - we want to scroll when we leave it
    if (pathname.startsWith('/product/')) {
      return;
    }
    // Only reset if we don't have pending navigation data
    const navData = sessionStorage.getItem('productNavigation');
    if (!navData) {
      scrollCompletedRef.current = false;
      setIsSearching(false);
      targetProductIdRef.current = null;
      maxScrollAttemptsRef.current = 0;
      lastCheckedProductsLengthRef.current = 0;
    }
  }, [pathname]);

  return { isSearching };
}
