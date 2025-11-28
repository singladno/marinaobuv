'use client';

import { useMemo } from 'react';

import { flattenOrdersToItems } from '@/utils/gruzchikUtils';

import { useGruzchikOrdersData } from './useGruzchikOrdersData';
import { useGruzchikOrdersUpdate } from './useGruzchikOrdersUpdate';

// Re-export types for backward compatibility
export type {
  GruzchikOrder,
  GruzchikOrderItem,
  GruzchikOrderItemRow,
} from '@/types/gruzchik';

export function useGruzchikOrders(status?: string) {
  const data = useGruzchikOrdersData(status);
  const update = useGruzchikOrdersUpdate(data.orders, data.setOrders);

  // Flatten orders into item rows - memoized to ensure updates trigger re-renders
  const itemRows = useMemo(() => {
    return flattenOrdersToItems(data.orders);
  }, [data.orders]);

  return {
    orders: data.orders,
    itemRows,
    loading: data.loading,
    error: data.error,
    pagination: data.pagination,
    onPageChange: data.onPageChange,
    onPageSizeChange: data.onPageSizeChange,
    reload: data.reload,
    updateOrderOptimistically: update.updateOrderOptimistically,
    updateItemAvailabilityOptimistically:
      update.updateItemAvailabilityOptimistically,
    updateItemPurchaseOptimistically:
      update.updateItemPurchaseOptimistically,
    updatingOrders: update.updatingOrders,
    isUpdatingItem: update.isUpdatingItem,
    isUpdatingItemToValue: update.isUpdatingItemToValue,
    isUnsettingItem: update.isUnsettingItem,
    isUnsettingItemFromTrue: update.isUnsettingItemFromTrue,
    isUnsettingItemFromFalse: update.isUnsettingItemFromFalse,
    isUpdatingPurchase: update.isUpdatingPurchase,
    isUpdatingPurchaseToValue: update.isUpdatingPurchaseToValue,
    isUnsettingPurchase: update.isUnsettingPurchase,
    isUnsettingPurchaseFromTrue: update.isUnsettingPurchaseFromTrue,
    isUnsettingPurchaseFromFalse: update.isUnsettingPurchaseFromFalse,
  };
}
