'use client';

import { useState, useEffect, useCallback } from 'react';

interface ProviderUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  providerId: string | null;
}

interface UseProvidersReturn {
  providers: ProviderUser[];
  loading: boolean;
  getUserIdByProviderId: (providerId: string) => string | null;
  getProviderIdByUserId: (userId: string) => string | null;
  reload: () => Promise<void>;
}

// Global cache to share across all instances
let globalProvidersCache: ProviderUser[] = [];
let globalLoadingState = false;
let globalLoadPromise: Promise<void> | null = null;

export function useProviders(): UseProvidersReturn {
  const [providers, setProviders] = useState<ProviderUser[]>(globalProvidersCache);
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
        const response = await fetch('/api/admin/users?role=PROVIDER&limit=100');
        if (response.ok) {
          const data = await response.json();
          // Filter users with PROVIDER role - providerId is optional
          globalProvidersCache = (data.users || []).filter(
            (u: any) => u.role === 'PROVIDER'
          );
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

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Sync state with global cache when it changes (for other component instances)
  useEffect(() => {
    // If global cache has data but local state doesn't, sync it
    if (globalProvidersCache.length > 0 && providers.length === 0 && !loading) {
      setProviders(globalProvidersCache);
    }
    // Also sync loading state
    if (globalLoadingState !== loading) {
      setLoading(globalLoadingState);
    }
  }, [providers.length, loading]);

  const getUserIdByProviderId = useCallback(
    (providerId: string): string | null => {
      const provider = providers.find(p => p.providerId === providerId);
      return provider?.id || null;
    },
    [providers]
  );

  const getProviderIdByUserId = useCallback(
    (userId: string): string | null => {
      const provider = providers.find(p => p.id === userId);
      return provider?.providerId || null;
    },
    [providers]
  );

  const reload = useCallback(async () => {
    globalProvidersCache = [];
    await loadProviders();
  }, [loadProviders]);

  return {
    providers,
    loading,
    getUserIdByProviderId,
    getProviderIdByUserId,
    reload,
  };
}
