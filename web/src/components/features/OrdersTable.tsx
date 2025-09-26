'use client';

import * as React from 'react';

import { useOrders } from '@/hooks/useOrders';
import type { AdminOrder, Gruzchik } from '@/hooks/useOrders';

import { OrdersTableActions } from './OrdersTableActions';
import { OrdersTableContent } from './OrdersTableContent';

export function OrdersTable() {
  const { orders, gruzchiks, loading, error, reload, update } = useOrders();
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const handleToggle = React.useCallback((id: string) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSelectAll = React.useCallback(
    (selectAll: boolean) => {
      const newSelected: Record<string, boolean> = {};
      if (selectAll) {
        orders.forEach(order => {
          newSelected[order.id] = true;
        });
      }
      setSelected(newSelected);
    },
    [orders]
  );

  const handlePatch = React.useCallback(
    async (id: string, patch: Partial<AdminOrder>) => {
      await update(id, patch);
    },
    [update]
  );

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="flex h-full flex-col rounded-lg bg-gray-50 dark:bg-gray-800">
      <OrdersTableActions
        selectedCount={selectedCount}
        onReload={reload}
        showBottomBorder={orders.length > 0}
      />

      <div className="min-h-0 flex-1">
        <OrdersTableContent
          orders={orders}
          gruzchiks={gruzchiks}
          loading={loading}
          error={error}
          selected={selected}
          onToggle={handleToggle}
          onSelectAll={handleSelectAll}
          onPatch={handlePatch}
        />
      </div>
    </div>
  );
}
