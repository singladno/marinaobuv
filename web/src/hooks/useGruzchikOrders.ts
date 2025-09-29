'use client';

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

  // Flatten orders into item rows
  const itemRows = flattenOrdersToItems(data.orders);

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
    updatingOrders: update.updatingOrders,
  };
}
