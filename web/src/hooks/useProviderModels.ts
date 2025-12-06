'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ProviderModel {
  id: string;
  name: string;
  phone: string | null;
  place: string | null;
}

interface UseProviderModelsReturn {
  providers: ProviderModel[];
  loading: boolean;
  reload: () => Promise<void>;
}

// Global cache to share across all instances
let globalProvidersCache: ProviderModel[] = [];
let globalLoadingState = false;
let globalLoadPromise: Promise<void> | null = null;

export function useProviderModels(): UseProviderModelsReturn {
  const [providers, setProviders] =
    useState<ProviderModel[]>(globalProvidersCache);
  const [loading, setLoading] = useState(globalLoadingState);

  const loadProviders = useCallback(async () => {
    // If already loading, wait for existing promise
    if (globalLoadPromise) {
      await globalLoadPromise;
      // After waiting, sync state with global cache
      setProviders(globalProvidersCache);
      setLoading(globalLoadingState);
      return;
    }

    // If cache is already populated, use it
    if (globalProvidersCache.length > 0) {
      setProviders(globalProvidersCache);
      setLoading(false);
      return;
    }

    globalLoadingState = true;
    setLoading(true);

    globalLoadPromise = (async () => {
      try {
        const response = await fetch('/api/admin/providers');
        if (response.ok) {
          const data = await response.json();
          globalProvidersCache = data || [];
          // Set providers BEFORE setting loading to false
          setProviders(globalProvidersCache);
          // Use a small delay to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 0));
        } else {
          globalProvidersCache = [];
          setProviders([]);
        }
      } catch (error) {
        console.error('Error loading providers:', error);
        globalProvidersCache = [];
        setProviders([]);
      } finally {
        globalLoadingState = false;
        setLoading(false);
        globalLoadPromise = null;
      }
    })();

    await globalLoadPromise;
  }, []);

  // Load providers only once on mount - use ref to ensure it only runs once
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    // Only load if we haven't loaded yet and cache is empty
    if (!hasLoadedRef.current && globalProvidersCache.length === 0) {
      hasLoadedRef.current = true;
      loadProviders();
    } else if (globalProvidersCache.length > 0) {
      // If cache is already populated, just sync state
      setProviders(globalProvidersCache);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Sync state with global cache when it changes (for other component instances)
  // Only sync if cache has data and we don't have it yet
  useEffect(() => {
    if (
      globalProvidersCache.length > 0 &&
      providers.length === 0 &&
      !loading &&
      !globalLoadingState
    ) {
      setProviders(globalProvidersCache);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only check once - the initial load effect handles the rest

  const reload = useCallback(async () => {
    globalProvidersCache = [];
    await loadProviders();
  }, [loadProviders]);

  return {
    providers,
    loading,
    reload,
  };
}

