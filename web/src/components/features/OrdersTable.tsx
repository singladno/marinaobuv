'use client';

import * as React from 'react';

import { BulkDeleteModal } from '@/components/ui/BulkDeleteModal';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useOrders } from '@/hooks/useOrders';
import type { AdminOrder } from '@/hooks/useOrders';

import { OrdersTableActions } from './OrdersTableActions';
import { OrdersTableContent } from './OrdersTableContent';

export function OrdersTable() {
  const { orders, gruzchiks, loading, error, reload, update, deleteOrders } =
    useOrders();
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const { addNotification } = useNotifications();

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

  const handleBulkDelete = React.useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = React.useCallback(async () => {
    const selectedOrderIds = Object.entries(selected)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedOrderIds.length === 0) return;

    try {
      await deleteOrders(selectedOrderIds);
      setSelected({});
      addNotification({
        type: 'success',
        title: 'Удаление заказов',
        message: `Успешно удалено ${selectedOrderIds.length} заказ${selectedOrderIds.length === 1 ? '' : selectedOrderIds.length < 5 ? 'а' : 'ов'}`,
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Ошибка при удалении заказов',
      });
    }
  }, [selected, deleteOrders, addNotification]);

  const handleCloseDeleteModal = React.useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleClearSelection = React.useCallback(() => {
    setSelected({});
  }, []);

  return (
    <div className="flex h-full flex-col rounded-lg bg-gray-50 dark:bg-gray-800">
      <OrdersTableActions
        selectedCount={selectedCount}
        onReload={reload}
        onBulkDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
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

      <BulkDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        selectedCount={selectedCount}
        itemName="заказ"
      />
    </div>
  );
}
