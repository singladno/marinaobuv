import {
  formatDate,
  formatPrice,
  getStatusBadgeVariant,
  getStatusText,
} from '@/utils/orderUtils';

import { useOrdersData } from './useOrdersData';

export function useOrdersPage() {
  const { orders, loading, error, isAuthenticated } = useOrdersData();

  return {
    orders,
    loading,
    error,
    isAuthenticated,
    getStatusBadgeVariant,
    getStatusText,
    formatDate,
    formatPrice,
  };
}
