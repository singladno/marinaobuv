'use client';

import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

import { StatusSelect } from '@/components/features/StatusSelect';
import type { Product } from '@/types/product';

interface ProductGenderCellProps {
  product: Product;
  gender: string | null;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
}

// Global cache to persist optimistic values across remounts
const globalOptimisticCache = new Map<string, string | null>();
const globalPendingCache = new Map<string, string | null>();

export function ProductGenderCell({
  product,
  gender,
  onUpdateProduct,
  disabled = false,
}: ProductGenderCellProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | null>(() => {
    // Initialize from global cache on mount
    return globalOptimisticCache.get(product.id) ?? null;
  });
  const [pendingValue, setPendingValue] = useState<string | null>(() => {
    // Initialize from global cache on mount
    return globalPendingCache.get(product.id) ?? null;
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getGenderLabel = (gender: string | null) => {
    switch (gender) {
      case 'FEMALE':
        return 'Женский';
      case 'MALE':
        return 'Мужской';
      default:
        return '-';
    }
  };

  // Always use cache value if state is null (handles remounts)
  const effectiveOptimisticValue =
    optimisticValue ?? globalOptimisticCache.get(product.id) ?? null;
  const effectivePendingValue =
    pendingValue ?? globalPendingCache.get(product.id) ?? null;

  const currentValue = effectiveOptimisticValue ?? getGenderLabel(gender);

  // Clear optimistic value ONLY when prop matches the pending value (server has confirmed the change)
  // Keep optimistic value if prop doesn't match - this prevents flickering when server response is delayed
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Sync cache with state
    if (optimisticValue !== null) {
      globalOptimisticCache.set(product.id, optimisticValue);
    }
    if (pendingValue !== null) {
      globalPendingCache.set(product.id, pendingValue);
    }

    if (
      effectiveOptimisticValue !== null &&
      effectivePendingValue !== null &&
      !isSaving
    ) {
      const propLabel =
        gender === 'FEMALE' ? 'Женский' : gender === 'MALE' ? 'Мужской' : '-';
      // Only clear if prop matches the pending value we sent
      // If prop doesn't match, keep showing optimistic value to prevent flicker
      if (propLabel === effectivePendingValue) {
        setOptimisticValue(null);
        setPendingValue(null);
        globalOptimisticCache.delete(product.id);
        globalPendingCache.delete(product.id);
      } else {
        // Prop doesn't match - set a timeout to check again after 2 seconds
        // This handles cases where prop update is delayed
        timeoutRef.current = setTimeout(() => {
          const currentPropLabel =
            gender === 'FEMALE'
              ? 'Женский'
              : gender === 'MALE'
                ? 'Мужской'
                : '-';
          const currentPending = globalPendingCache.get(product.id);
          if (currentPropLabel === currentPending) {
            setOptimisticValue(null);
            setPendingValue(null);
            globalOptimisticCache.delete(product.id);
            globalPendingCache.delete(product.id);
          }
          timeoutRef.current = null;
        }, 2000);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    gender,
    optimisticValue,
    pendingValue,
    isSaving,
    effectiveOptimisticValue,
    effectivePendingValue,
  ]);

  const handleSave = (value: string) => {
    // Don't update if already showing this value and not saving
    if (optimisticValue === value && !isSaving) {
      return;
    }

    const previousValue = currentValue;

    // CRITICAL: Set state IMMEDIATELY and flush synchronously to ensure UI updates
    // This ensures the value updates instantly, same as price control
    flushSync(() => {
      setOptimisticValue(value);
      setPendingValue(value);
      setIsSaving(true);
      // Also update global cache to persist across remounts
      globalOptimisticCache.set(product.id, value);
      globalPendingCache.set(product.id, value);
    });

    // Defer async request to next tick so UI updates immediately
    Promise.resolve().then(() => {
      const genderMap: Record<string, string | null> = {
        Женский: 'FEMALE',
        Мужской: 'MALE',
        '-': null,
      };

      onUpdateProduct(product.id, { gender: genderMap[value] || null })
        .then(() => {
          // Success - keep optimistic value until prop matches
          // The useEffect will handle clearing when prop matches
        })
        .catch(error => {
          console.error(
            '[ProductGenderCell] Error updating product gender:',
            error
          );
          // Revert on error
          setOptimisticValue(previousValue);
          setPendingValue(null);
          if (previousValue !== null) {
            globalOptimisticCache.set(product.id, previousValue);
          } else {
            globalOptimisticCache.delete(product.id);
          }
          globalPendingCache.delete(product.id);
        })
        .finally(() => {
          // Set isSaving to false synchronously so status prop updates immediately
          setIsSaving(false);
        });
    });
  };

  return (
    <StatusSelect
      value={currentValue}
      options={[
        { value: 'Женский', label: 'Женский' },
        { value: 'Мужской', label: 'Мужской' },
        { value: '-', label: '-' },
      ]}
      onChange={val => {
        handleSave(val);
      }}
      disabled={disabled}
      status={isSaving ? 'saving' : 'idle'}
      aria-label="Пол"
    />
  );
}
