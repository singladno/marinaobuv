'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { SupplierSelector } from '@/components/admin/SupplierSelector';
import { useProviders } from '@/hooks/useProviders';
import type { Product, ProductUpdateData } from '@/types/product';

interface ProductProviderEditableCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

export function ProductProviderEditableCell({
  product,
  onUpdateProduct,
}: ProductProviderEditableCellProps) {
  const {
    getUserIdByProviderId,
    loading: providersLoading,
    providers,
  } = useProviders();
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastProviderIdRef = useRef<string | null>(null);

  // Convert Provider ID to User ID when product loads
  useEffect(() => {
    const providerId = (product as any).providerId;

    // Only update if providerId actually changed
    if (providerId === lastProviderIdRef.current) {
      return;
    }

    lastProviderIdRef.current = providerId;

    if (!providerId) {
      setUserId(null);
      return;
    }

    // Wait for providers to load before trying to convert
    // Also check that providers array is not empty
    if (providersLoading || providers.length === 0) {
      return;
    }

    // Use the shared providers list to find user ID
    const foundUserId = getUserIdByProviderId(providerId);
    setUserId(foundUserId);
  }, [product, getUserIdByProviderId, providersLoading, providers.length]);

  // Also try to convert when providers finish loading (in case product loaded first)
  useEffect(() => {
    // Wait for providers to actually be loaded (not just loading = false)
    if (!providersLoading && providers.length > 0) {
      const providerId = (product as any).providerId;
      // Always try to convert when providers finish loading
      // This handles the case where product loaded before providers
      if (providerId) {
        const foundUserId = getUserIdByProviderId(providerId);
        // Update if we found a userId (even if it's different from current)
        if (foundUserId) {
          setUserId(foundUserId);
        }
      }
    }
  }, [providersLoading, providers.length, product, getUserIdByProviderId]);

  const handleChange = async (newUserId: string | null) => {
    // Don't update if value hasn't changed
    if (newUserId === userId && !isSaving) return;

    const previousUserId = userId;

    // Set isSaving synchronously FIRST so loader appears immediately
    setIsSaving(true);

    // Update optimistic value with startTransition for non-blocking update
    startTransition(() => {
      setUserId(newUserId);
    });

    // Defer async request to next tick so UI updates immediately
    Promise.resolve().then(() => {
      // Pass User ID to API, it will convert to Provider ID
      onUpdateProduct(product.id, { providerId: newUserId })
        .then(() => {
          // Success - keep optimistic value
        })
        .catch(error => {
          console.error('Error updating provider:', error);
          // Revert on error
          setUserId(previousUserId);
        })
        .finally(() => {
          // Set isSaving to false synchronously so status prop updates immediately
          setIsSaving(false);
        });
    });
  };

  if (providersLoading) {
    return (
      <div className="w-full">
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <SupplierSelector
        value={userId}
        onChange={handleChange}
        placeholder="Выберите поставщика"
        disabled={isSaving}
        isLoading={isSaving}
      />
    </div>
  );
}
