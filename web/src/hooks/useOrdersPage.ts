import {
  formatDate,
  formatPrice,
  getStatusBadgeVariant,
  getStatusText,
} from '@/utils/orderUtils';

import { useOrdersData } from './useOrdersData';

export function useOrdersPage() {
  const { orders, loading, error } = useOrdersData();

  return {
    orders,
    loading,
    error,
    getStatusBadgeVariant,
    getStatusText,
    formatDate,
    formatPrice,
  };
}
