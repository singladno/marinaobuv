'use client';

import * as React from 'react';

import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useOrders } from '@/hooks/useOrders';
import { useDebounce } from '@/hooks/useDebounce';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import type { AdminOrder } from '@/hooks/useOrders';
import {
  formatBulkOrdersDeletedMessage,
  formatOrderNumber,
  pluralOrdersRu,
} from '@/utils/orderNumberUtils';

import { OrdersTableActions } from './OrdersTableActions';
import { OrdersTableContent } from './OrdersTableContent';

export function OrdersTable() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [deletingOrderId, setDeletingOrderId] = React.useState<string | null>(
    null
  );
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { orders, gruzchiks, loading, error, reload, update, deleteOrders } =
    useOrders(debouncedSearchQuery);
  const { addNotification } = useNotifications();
  const confirmationModal = useConfirmationModal();

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

  React.useEffect(() => {
    setSelectedIds(prev => {
      const orderIdSet = new Set(orders.map(o => o.id));
      const next = new Set([...prev].filter(id => orderIdSet.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [orders]);

  const selectedCount = selectedIds.size;
  const allSelected = orders.length > 0 && selectedCount === orders.length;
  const someSelected = selectedCount > 0 && selectedCount < orders.length;

  const onToggleSelect = React.useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onSelectAll = React.useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        setSelectedIds(new Set(orders.map(o => o.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [orders]
  );

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handlePatch = React.useCallback(
    async (id: string, patch: Partial<AdminOrder>) => {
      await update(id, patch);
    },
    [update]
  );

  const handleDelete = React.useCallback(
    async (order: AdminOrder) => {
      const displayNumber = order.orderNumber
        ? formatOrderNumber(order.orderNumber)
        : `#${order.id.slice(-8)}`;

      const confirmed = await confirmationModal.showConfirmation({
        title: 'Удалить заказ?',
        message: `Вы уверены, что хотите удалить заказ ${displayNumber}? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'danger',
      });

      if (!confirmed) return;

      try {
        confirmationModal.setLoading(true);
        setDeletingOrderId(order.id);
        await deleteOrders([order.id]);
        addNotification({
          type: 'success',
          title: 'Заказ удалён',
          message: `Заказ ${displayNumber} успешно удалён`,
        });
        confirmationModal.closeModal();
      } catch (err) {
        addNotification({
          type: 'error',
          title: 'Ошибка удаления',
          message: err instanceof Error ? err.message : 'Неизвестная ошибка',
        });
        confirmationModal.setLoading(false);
      } finally {
        setDeletingOrderId(null);
      }
    },
    [confirmationModal, deleteOrders, addNotification]
  );

  const handleBulkDelete = React.useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    const confirmed = await confirmationModal.showConfirmation({
      title: 'Удалить выбранные заказы?',
      message: `Вы уверены, что хотите удалить ${ids.length} ${pluralOrdersRu(ids.length)}? Это действие нельзя отменить.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      confirmationModal.setLoading(true);
      setIsBulkDeleting(true);
      const result = await deleteOrders(ids);
      clearSelection();
      addNotification({
        type: 'success',
        title: 'Заказы удалены',
        message: formatBulkOrdersDeletedMessage(
          result?.deletedCount ?? ids.length
        ),
      });
      confirmationModal.closeModal();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Ошибка удаления',
        message: err instanceof Error ? err.message : 'Неизвестная ошибка',
      });
      confirmationModal.setLoading(false);
    } finally {
      setIsBulkDeleting(false);
    }
  }, [
    selectedIds,
    confirmationModal,
    deleteOrders,
    clearSelection,
    addNotification,
  ]);

  const isDeleting = isBulkDeleting || deletingOrderId !== null;

  return (
    <div className="flex h-full flex-col rounded-lg bg-gray-50 dark:bg-gray-800">
      <OrdersTableActions
        onReload={reload}
        showBottomBorder={orders.length > 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCount={selectedCount}
        onBulkDelete={selectedCount > 0 ? handleBulkDelete : undefined}
        onClearSelection={selectedCount > 0 ? clearSelection : undefined}
        isBulkDeleting={isBulkDeleting}
      />

      <div className="min-h-0 flex-1">
        <OrdersTableContent
          orders={orders}
          gruzchiks={gruzchiks}
          loading={loading}
          error={error}
          onPatch={handlePatch}
          onDelete={handleDelete}
          deletingOrderId={deletingOrderId}
          isSearchResult={searchQuery.trim().length > 0}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectAll={onSelectAll}
          allSelected={allSelected}
          someSelected={someSelected}
          selectionDisabled={isDeleting}
        />
      </div>

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={confirmationModal.handleCancel}
        onConfirm={confirmationModal.handleConfirm}
        title={confirmationModal.options.title}
        message={confirmationModal.options.message}
        confirmText={confirmationModal.options.confirmText}
        cancelText={confirmationModal.options.cancelText}
        variant={confirmationModal.options.variant}
        isLoading={confirmationModal.isLoading}
      />
    </div>
  );
}
