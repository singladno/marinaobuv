import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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
  const router = useRouter();
  const targetProductIdRef = useRef<string | null>(null);
  const scrollCompletedRef = useRef(false);
  const maxScrollAttemptsRef = useRef(0);
  const lastCheckedProductsLengthRef = useRef(0);
  const urlRestoredRef = useRef(false);
  const [urlCheckTrigger, setUrlCheckTrigger] = useState(0);
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

      // Parse referrer to get the path and query params (this is the page we were on when we clicked the product)
      let referrerUrl: URL;
      let referrerPath: string;
      let referrerSearch: string;
      try {
        referrerUrl = referrer.startsWith('http')
          ? new URL(referrer)
          : new URL(referrer, window.location.origin);
        referrerPath = referrerUrl.pathname;
        referrerSearch = referrerUrl.search;
      } catch {
        const [path, search] = referrer.split('?');
        referrerPath = path;
        referrerSearch = search ? `?${search}` : '';
      }

      // Check if current path matches target path pattern
      const currentPathWithSearch = currentUrlObj.pathname + currentUrlObj.search;
      const pathMatches =
        typeof targetPath === 'string'
          ? currentPathWithSearch === targetPath || currentPathWithSearch.startsWith(`${targetPath}?`) || currentPathWithSearch.startsWith(`${targetPath}/`)
          : targetPath.test(currentPathWithSearch);

      // Only proceed if we're on the target page
      if (!pathMatches) {
        // Not on target page, don't scroll
        return;
      }

      // If we're on the target page but URL doesn't match referrer (different query params),
      // restore the referrer URL to get back to the correct page
      const referrerPathWithSearch = referrerPath + referrerSearch;
      const currentPathOnly = currentUrlObj.pathname;
      const referrerPathOnly = referrerPath;

      // Check if pathname matches and if we need to restore query params
      if (currentPathOnly === referrerPathOnly && currentUrlObj.search !== referrerSearch && !urlRestoredRef.current) {
        // Path matches but query params don't - restore the referrer URL
        urlRestoredRef.current = true;
        router.replace(referrerPathWithSearch);
        // Trigger a re-check after a short delay to allow navigation to complete
        setTimeout(() => {
          setUrlCheckTrigger(prev => prev + 1);
        }, 100);
        // Return early to let the navigation complete, then this effect will run again
        return;
      }

      // If we just restored the URL, wait for it to take effect
      // The URL should match now, so we can proceed
      if (urlRestoredRef.current && currentUrlObj.search === referrerSearch) {
        // URL has been restored successfully, reset the flag and proceed
        urlRestoredRef.current = false;
      } else if (urlRestoredRef.current && currentUrlObj.search !== referrerSearch) {
        // Still waiting for URL to be restored, return early
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
        urlRestoredRef.current = false;
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
            urlRestoredRef.current = false;
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
      urlRestoredRef.current = false;
    }
  }, [
    loading,
    productsLength,
    loadingMore,
    hasNextPage,
    loadMore,
    pathname,
    targetPath,
    router,
    urlCheckTrigger,
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
      urlRestoredRef.current = false;
    }
  }, [pathname]);

  return { isSearching };
}
