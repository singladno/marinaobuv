'use client';

import {
  useState,
  useEffect,
  useRef,
  startTransition,
  memo,
  useMemo,
} from 'react';
import { flushSync } from 'react-dom';
import { SupplierSelector } from '@/components/admin/SupplierSelector';
import { useProviders } from '@/hooks/useProviders';
import type { Product, ProductUpdateData } from '@/types/product';

interface ProductProviderEditableCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

// Global cache to persist userId across all component instances and remounts
// This is outside the component so it persists across remounts
const globalUserIdCache = new Map<string, string | null>();

function ProductProviderEditableCellComponent({
  product,
  onUpdateProduct,
}: ProductProviderEditableCellProps) {
  const {
    getUserIdByProviderId,
    loading: providersLoading,
    providers,
  } = useProviders();

  // Convert Provider ID to User ID when providerId changes (not when entire product changes)
  const currentProviderId = (product as any).providerId;

  // CRITICAL: Check cache FIRST before any refs to ensure we have the value immediately
  // This prevents any null state on remount
  const cachedUserIdOnMount = globalUserIdCache.get(product.id);

  // Initialize refs from product data to persist across remounts
  // Initialize lastProviderIdRef with current providerId so it doesn't reset on remount
  const lastProviderIdRef = useRef<string | null>(currentProviderId ?? null);
  const lastConvertedUserIdRef = useRef<string | null>(
    cachedUserIdOnMount ?? null
  );
  const isInitializedRef = useRef(cachedUserIdOnMount !== undefined);

  // CRITICAL: Use a ref to track effectiveUserId that persists across remounts
  // This ensures we always have the correct value even during remounts
  // The cache is the source of truth, userId is just for optimistic updates
  // MUST be declared before useState initializer that uses it
  // Initialize from cache immediately to prevent null state
  const effectiveUserIdRef = useRef<string | null>(cachedUserIdOnMount ?? null);

  // Initialize userId from cache or product's providerId if providers are already loaded
  // Use lazy initialization to compute initial userId only once
  // CRITICAL: Only initialize once per product.id to prevent resets on remounts
  const [userId, setUserId] = useState<string | null>(() => {
    // First, try to restore from global cache (for remounts)
    const cachedUserId = globalUserIdCache.get(product.id);
    if (cachedUserId !== undefined) {
      // Always sync refs with cache on mount
      lastConvertedUserIdRef.current = cachedUserId;
      effectiveUserIdRef.current = cachedUserId;
      // Mark as initialized if we have a cached value
      if (cachedUserId !== null) {
        isInitializedRef.current = true;
      }
      // Only log if this is a meaningful restore (not just initial mount)
      // We can't easily detect if this is a remount, so we'll log it but it's expected
      return cachedUserId;
    }

    // If not in cache, compute from providers if they're loaded
    if (currentProviderId && !providersLoading && providers.length > 0) {
      const provider = providers.find(p => p.providerId === currentProviderId);
      const foundUserId = provider?.id || null;
      if (foundUserId) {
        lastConvertedUserIdRef.current = foundUserId;
        effectiveUserIdRef.current = foundUserId;
        isInitializedRef.current = true;
        globalUserIdCache.set(product.id, foundUserId);
        return foundUserId;
      }
    }
    return null;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Refs to track previous values for the main effect to avoid unnecessary updates
  const prevProviderIdRef = useRef<string | null>(currentProviderId ?? null);
  const prevProvidersLengthRef = useRef<number>(providers.length);
  const prevProvidersLoadingRef = useRef<boolean>(providersLoading);

  // CRITICAL: Always sync userId with cache to prevent resets during remounts
  // Check cache on every render and sync if userId is null but cache has a value
  // Only run when userId or product.id actually changes (not on every render)
  // Use ref to track previous userId to prevent unnecessary updates
  const prevUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
    // Skip if userId hasn't actually changed
    if (prevUserIdRef.current === userId) {
      return;
    }
    prevUserIdRef.current = userId;

    const cachedUserId = globalUserIdCache.get(product.id);
    const currentEffective = userId ?? cachedUserId ?? null;

    // Update ref immediately to ensure it's always current
    if (effectiveUserIdRef.current !== currentEffective) {
      effectiveUserIdRef.current = currentEffective;
    }

    // Sync userId if it's null but cache has a value
    // Only sync if there's a mismatch to prevent unnecessary updates
    if (
      userId === null &&
      cachedUserId !== undefined &&
      cachedUserId !== null &&
      effectiveUserIdRef.current !== cachedUserId
    ) {
      setUserId(cachedUserId);
      lastConvertedUserIdRef.current = cachedUserId;
      effectiveUserIdRef.current = cachedUserId;
    }
  }, [userId, product.id]);

  // CRITICAL: Compute effectiveUserId directly from cache on every render
  // This ensures it's always correct, even on remount, preventing SupplierSelector resets
  // The cache is the single source of truth - userId state is just for optimistic updates
  const cachedUserId = globalUserIdCache.get(product.id);
  const effectiveUserId =
    cachedUserId !== undefined ? cachedUserId : (userId ?? null);

  // CRITICAL: Always sync refs with the computed value on every render
  // This prevents any drift and ensures refs are always current
  if (effectiveUserIdRef.current !== effectiveUserId) {
    effectiveUserIdRef.current = effectiveUserId;
  }
  if (lastConvertedUserIdRef.current !== effectiveUserId) {
    lastConvertedUserIdRef.current = effectiveUserId;
  }

  // Main effect: convert providerId to userId when providerId changes OR when providers finish loading
  // Use refs to track previous values and only update when actually needed
  useEffect(() => {
    const providerIdChanged = currentProviderId !== prevProviderIdRef.current;
    const providersLengthChanged =
      providers.length !== prevProvidersLengthRef.current;
    const providersLoadingChanged =
      providersLoading !== prevProvidersLoadingRef.current;

    // Only process if something actually changed
    if (
      !providerIdChanged &&
      !providersLengthChanged &&
      !providersLoadingChanged
    ) {
      // Nothing changed, skip processing
      return;
    }

    // Update refs
    prevProviderIdRef.current = currentProviderId ?? null;
    prevProvidersLengthRef.current = providers.length;
    prevProvidersLoadingRef.current = providersLoading;

    // Update lastProviderIdRef if it changed
    if (providerIdChanged) {
      lastProviderIdRef.current = currentProviderId;
    }

    if (!currentProviderId) {
      if (providerIdChanged) {
        setUserId(null);
        lastConvertedUserIdRef.current = null;
        effectiveUserIdRef.current = null;
        // Update global cache to persist across remounts
        globalUserIdCache.set(product.id, null);
        isInitializedRef.current = true;
      }
      return;
    }

    // Wait for providers to load before trying to convert
    if (providersLoading || providers.length === 0) {
      return;
    }

    // Find provider directly from providers array to avoid callback dependency issues
    const provider = providers.find(p => p.providerId === currentProviderId);
    const foundUserId = provider?.id || null;

    // Check global cache to see if we have a valid userId that should be preserved
    const cachedUserId = globalUserIdCache.get(product.id);

    // If userId is null but we have a cached value, restore it first
    if (
      userId === null &&
      cachedUserId !== undefined &&
      cachedUserId !== null
    ) {
      lastConvertedUserIdRef.current = cachedUserId;
      effectiveUserIdRef.current = cachedUserId;
      setUserId(cachedUserId);
      isInitializedRef.current = true;
      return; // Exit early, we've restored from cache
    }

    // Only update if providerId actually changed
    // Don't update just because providers array reference changed
    if (!providerIdChanged) {
      // ProviderId didn't change, just ensure cache is in sync
      if (userId !== null && userId !== undefined) {
        globalUserIdCache.set(product.id, userId);
        if (lastConvertedUserIdRef.current !== userId) {
          lastConvertedUserIdRef.current = userId;
        }
        if (effectiveUserIdRef.current !== userId) {
          effectiveUserIdRef.current = userId;
        }
      } else if (foundUserId !== null && foundUserId !== undefined) {
        globalUserIdCache.set(product.id, foundUserId);
      }
      return;
    }

    // ProviderId changed, update userId
    if (foundUserId !== lastConvertedUserIdRef.current) {
      lastConvertedUserIdRef.current = foundUserId;
      effectiveUserIdRef.current = foundUserId;
      // Update global cache to persist across remounts
      globalUserIdCache.set(product.id, foundUserId);
      setUserId(foundUserId);
      isInitializedRef.current = true;
    }
  }, [currentProviderId, providersLoading, providers.length, product.id]); // Use providers.length instead of providers array

  // Watch userId and restore from cache if it becomes null unexpectedly
  useEffect(() => {
    const cachedUserId = globalUserIdCache.get(product.id);
    if (
      userId === null &&
      cachedUserId !== undefined &&
      cachedUserId !== null
    ) {
      lastConvertedUserIdRef.current = cachedUserId;
      setUserId(cachedUserId);
    }
  }, [userId, product.id]);

  // Track previous values to prevent unnecessary effect runs
  const prevProvidersLoadingRef2 = useRef<boolean>(providersLoading);
  const prevProvidersLengthRef2 = useRef<number>(providers.length);
  const prevProviderIdRef2 = useRef<string | null>(currentProviderId ?? null);

  // Also try to convert when providers finish loading (in case product loaded first)
  useEffect(() => {
    // Skip if nothing actually changed
    const providersLoadingChanged =
      providersLoading !== prevProvidersLoadingRef2.current;
    const providersLengthChanged =
      providers.length !== prevProvidersLengthRef2.current;
    const providerIdChanged = currentProviderId !== prevProviderIdRef2.current;

    if (
      !providersLoadingChanged &&
      !providersLengthChanged &&
      !providerIdChanged
    ) {
      return; // Nothing changed, skip
    }

    // Update refs
    prevProvidersLoadingRef2.current = providersLoading;
    prevProvidersLengthRef2.current = providers.length;
    prevProviderIdRef2.current = currentProviderId ?? null;

    // Wait for providers to actually be loaded (not just loading = false)
    // Only run if not already initialized to prevent unnecessary updates
    if (
      !providersLoading &&
      providers.length > 0 &&
      currentProviderId &&
      !isInitializedRef.current
    ) {
      // Find provider directly from providers array
      const provider = providers.find(p => p.providerId === currentProviderId);
      const foundUserId = provider?.id || null;
      // Only update if different from current
      if (foundUserId !== lastConvertedUserIdRef.current) {
        lastConvertedUserIdRef.current = foundUserId;
        effectiveUserIdRef.current = foundUserId;
        // Update global cache to persist across remounts
        globalUserIdCache.set(product.id, foundUserId);
        setUserId(foundUserId);
        isInitializedRef.current = true;
      } else {
        // Even if not updating, mark as initialized
        isInitializedRef.current = true;
      }
    }
  }, [providersLoading, providers.length, currentProviderId, product.id]);

  const handleChange = async (newUserId: string | null) => {
    // Get the current effectiveUserId at the time of the call (before any updates)
    // Use ref to get the most current value, not the render-time value
    const currentEffectiveUserId =
      effectiveUserIdRef.current ??
      globalUserIdCache.get(product.id) ??
      userId ??
      null;

    // Check if value actually changed
    const valueChanged = newUserId !== currentEffectiveUserId;

    // CRITICAL: Always set isSaving FIRST, before any checks
    // This ensures the loader appears immediately when onChange is called
    // This must happen synchronously so the UI updates immediately
    flushSync(() => {
      setIsSaving(true);
    });

    // Only skip if value truly hasn't changed (not just a timing issue)
    // But always show loader first, then clear it if we're skipping
    if (!valueChanged) {
      // Clear isSaving since we're not actually saving
      flushSync(() => {
        setIsSaving(false);
      });
      return;
    }

    const previousUserId = currentEffectiveUserId;

    // Update optimistic value with startTransition for non-blocking update
    startTransition(() => {
      setUserId(newUserId);
      // Update ref and global cache to prevent effects from resetting it
      lastConvertedUserIdRef.current = newUserId;
      effectiveUserIdRef.current = newUserId;
      globalUserIdCache.set(product.id, newUserId);
    });

    // Defer async request to next tick so UI updates immediately
    Promise.resolve().then(() => {
      // Pass User ID to API, it will convert to Provider ID
      onUpdateProduct(product.id, { providerId: newUserId })
        .then(() => {
          // Success - keep optimistic value and update ref and global cache
          lastConvertedUserIdRef.current = newUserId;
          globalUserIdCache.set(product.id, newUserId);
        })
        .catch(error => {
          console.error(
            '[ProductProviderEditableCell] Error updating provider:',
            error
          );
          // Revert on error
          setUserId(previousUserId);
          lastConvertedUserIdRef.current = previousUserId;
          effectiveUserIdRef.current = previousUserId;
          globalUserIdCache.set(product.id, previousUserId);
        })
        .finally(() => {
          // Set isSaving to false synchronously so status prop updates immediately
          setIsSaving(false);
        });
    });
  };

  // Show loader when providers are loading OR when saving
  const isLoading = providersLoading || isSaving;

  return (
    <div className="w-full">
      <SupplierSelector
        value={effectiveUserId}
        onChange={handleChange}
        placeholder="Выберите поставщика"
        disabled={isSaving || providersLoading}
        isLoading={isLoading}
      />
    </div>
  );
}

// Memoize the component to prevent re-renders when other product properties change
// Only re-render if product.id or product.providerId changes
export const ProductProviderEditableCell = memo(
  ProductProviderEditableCellComponent,
  (prevProps, nextProps) => {
    // Only re-render if product ID or providerId changes
    // This prevents remounting when other fields (like price) are updated
    // Don't check onUpdateProduct equality as it might be recreated
    const prevProviderId = (prevProps.product as any).providerId;
    const nextProviderId = (nextProps.product as any).providerId;

    return (
      prevProps.product.id === nextProps.product.id &&
      prevProviderId === nextProviderId
    );
  }
);

ProductProviderEditableCell.displayName = 'ProductProviderEditableCell';
