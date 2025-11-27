'use client';

import * as React from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useOrders } from '@/hooks/useOrders';
import { useDebounce } from '@/hooks/useDebounce';
import type { AdminOrder } from '@/hooks/useOrders';

import { OrdersTableActions } from './OrdersTableActions';
import { OrdersTableContent } from './OrdersTableContent';

export function OrdersTable() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { orders, gruzchiks, loading, error, reload, update } = useOrders(debouncedSearchQuery);
  const { addNotification } = useNotifications();

  // Refresh orders when user returns to this page (e.g., from order details)
  React.useEffect(() => {
    const handleFocus = () => {
      reload();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        reload();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [reload]);

  const handlePatch = React.useCallback(
    async (id: string, patch: Partial<AdminOrder>) => {
      await update(id, patch);
    },
    [update]
  );

  return (
    <div className="flex h-full flex-col rounded-lg bg-gray-50 dark:bg-gray-800">
      <OrdersTableActions
        onReload={reload}
        showBottomBorder={orders.length > 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="min-h-0 flex-1">
        <OrdersTableContent
          orders={orders}
          gruzchiks={gruzchiks}
          loading={loading}
          error={error}
          onPatch={handlePatch}
          isSearchResult={searchQuery.trim().length > 0}
        />
      </div>
    </div>
  );
}
