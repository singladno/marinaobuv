'use client';

import { useState, useRef, startTransition, memo } from 'react';
import { flushSync } from 'react-dom';
import { SupplierSelector } from '@/components/admin/SupplierSelector';
import { useProviderModels } from '@/hooks/useProviderModels';
import type { Product, ProductUpdateData } from '@/types/product';

interface ProductProviderEditableCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

function ProductProviderEditableCellComponent({
  product,
  onUpdateProduct,
}: ProductProviderEditableCellProps) {
  const { loading: providersLoading } = useProviderModels();
  const [isSaving, setIsSaving] = useState(false);
  const currentProviderId = product.providerId;

  const handleChange = async (newProviderId: string | null) => {
    // Check if value actually changed
    const valueChanged = newProviderId !== currentProviderId;

    // CRITICAL: Always set isSaving FIRST, before any checks
    // This ensures the loader appears immediately when onChange is called
    flushSync(() => {
      setIsSaving(true);
    });

    // Only skip if value truly hasn't changed
    if (!valueChanged) {
      flushSync(() => {
        setIsSaving(false);
      });
      return;
    }

    const previousProviderId = currentProviderId;

    // Defer async request to next tick so UI updates immediately
    Promise.resolve().then(() => {
      // Pass Provider ID directly to API (API can handle Provider IDs)
      onUpdateProduct(product.id, { providerId: newProviderId })
        .then(() => {
          // Success - the product will be reloaded and the value will update
        })
        .catch(error => {
          console.error(
            '[ProductProviderEditableCell] Error updating provider:',
            error
          );
          // On error, the product will be reloaded and revert to previous value
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
        value={currentProviderId}
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
    const prevProviderId = prevProps.product.providerId;
    const nextProviderId = nextProps.product.providerId;

    return (
      prevProps.product.id === nextProps.product.id &&
      prevProviderId === nextProviderId
    );
  }
);

ProductProviderEditableCell.displayName = 'ProductProviderEditableCell';
