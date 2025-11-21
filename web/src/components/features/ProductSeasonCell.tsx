'use client';

import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

import { StatusSelect } from '@/components/features/StatusSelect';
import type { Product } from '@/types/product';

interface ProductSeasonCellProps {
  product: Product;
  season: string | null;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
}

// Global cache to persist optimistic values across remounts
const globalOptimisticCache = new Map<string, string | null>();
const globalPendingCache = new Map<string, string | null>();

export function ProductSeasonCell({
  product,
  season,
  onUpdateProduct,
  disabled = false,
}: ProductSeasonCellProps) {
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

  const getSeasonLabel = (season: string | null) => {
    switch (season) {
      case 'SPRING':
        return 'Весна';
      case 'SUMMER':
        return 'Лето';
      case 'AUTUMN':
        return 'Осень';
      case 'WINTER':
        return 'Зима';
      default:
        return '-';
    }
  };

  // Always use cache value if state is null (handles remounts)
  const effectiveOptimisticValue =
    optimisticValue ?? globalOptimisticCache.get(product.id) ?? null;
  const effectivePendingValue =
    pendingValue ?? globalPendingCache.get(product.id) ?? null;

  const currentValue = effectiveOptimisticValue ?? getSeasonLabel(season);

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
        season === 'SPRING'
          ? 'Весна'
          : season === 'SUMMER'
            ? 'Лето'
            : season === 'AUTUMN'
              ? 'Осень'
              : season === 'WINTER'
                ? 'Зима'
                : '-';
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
            season === 'SPRING'
              ? 'Весна'
              : season === 'SUMMER'
                ? 'Лето'
                : season === 'AUTUMN'
                  ? 'Осень'
                  : season === 'WINTER'
                    ? 'Зима'
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
    season,
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
      const seasonMap: Record<string, string | null> = {
        Весна: 'SPRING',
        Лето: 'SUMMER',
        Осень: 'AUTUMN',
        Зима: 'WINTER',
        '-': null,
      };

      onUpdateProduct(product.id, { season: seasonMap[value] || null })
        .then(() => {
          // Success - keep optimistic value until prop matches
          // The useEffect will handle clearing when prop matches
        })
        .catch(error => {
          console.error(
            '[ProductSeasonCell] Error updating product season:',
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
        { value: 'Весна', label: 'Весна' },
        { value: 'Лето', label: 'Лето' },
        { value: 'Осень', label: 'Осень' },
        { value: 'Зима', label: 'Зима' },
        { value: '-', label: '-' },
      ]}
      onChange={val => {
        handleSave(val);
      }}
      disabled={disabled}
      status={isSaving ? 'saving' : 'idle'}
      aria-label="Сезон"
    />
  );
}
