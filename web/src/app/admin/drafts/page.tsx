'use client';

import * as React from 'react';

import { DraftsTable } from '@/components/features/DraftsTable';
import type { Draft } from '@/types/admin';
import { useDrafts } from '@/hooks/useDrafts';
import { useCategories } from '@/hooks/useCategories';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TablePagination } from '@/components/ui/TablePagination';

export default function AdminDraftsPage() {
  const {
    data,
    loading,
    error,
    reload,
    reloadSilent,
    status,
    setStatus,
    pagination,
    goToPage,
    changePageSize,
  } = useDrafts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { addNotification } = useNotifications();
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const selectedIds = React.useMemo(
    () => Object.keys(selected).filter(k => selected[k]),
    [selected]
  );

  const toggle = React.useCallback((id: string) => {
    setSelected((m: Record<string, boolean>) => ({ ...m, [id]: !m[id] }));
  }, []);

  const selectAll = React.useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        // Select all items
        const allSelected = data.reduce(
          (acc, item) => {
            acc[item.id] = true;
            return acc;
          },
          {} as Record<string, boolean>
        );
        setSelected(allSelected);
      } else {
        // Deselect all items
        setSelected({});
      }
    },
    [data]
  );

  const inlinePatch = React.useCallback(
    async (id: string, patch: Partial<Draft>) => {
      await fetch(`/api/admin/drafts`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ id, data: patch }),
      });
      // Avoid global loader; refresh in background
      await reloadSilent();
    },
    [reloadSilent]
  );
  const approve = async () => {
    try {
      const res = await fetch(`/api/admin/drafts/approve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        addNotification({
          type: 'error',
          title: 'Ошибка при одобрении',
          message: errorText,
        });
        return;
      }

      addNotification({
        type: 'success',
        title: 'Успешно одобрено',
        message: `Одобрено ${selectedIds.length} черновиков`,
      });

      await reload();
      setSelected({});
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка при одобрении',
        message: 'Произошла неожиданная ошибка',
      });
    }
  };

  const convertToCatalog = async () => {
    try {
      const res = await fetch(`/api/admin/drafts/convert-to-catalog`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        addNotification({
          type: 'error',
          title: 'Ошибка при добавлении в каталог',
          message: errorText,
        });
        return;
      }

      addNotification({
        type: 'success',
        title: 'Успешно добавлено в каталог',
        message: `Добавлено ${selectedIds.length} товаров в каталог`,
      });

      await reload();
      setSelected({});
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка при добавлении в каталог',
        message: 'Произошла неожиданная ошибка',
      });
    }
  };

  const handleBulkDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/drafts/bulk-delete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        addNotification({
          type: 'error',
          title: 'Ошибка при удалении',
          message: errorText,
        });
        return;
      }

      const result = await res.json();
      addNotification({
        type: 'success',
        title: 'Успешно удалено',
        message: `Удалено ${result.count} черновиков`,
      });

      await reload();
      setSelected({});
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка при удалении',
        message: 'Произошла неожиданная ошибка',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Table with reserved space for pagination */}
      <div className="min-h-0 flex-1">
        <DraftsTable
          data={data}
          selected={selected}
          onToggle={toggle}
          onSelectAll={selectAll}
          onPatch={inlinePatch}
          status={status}
          onStatusChange={setStatus}
          onReload={reload}
          onApprove={approve}
          onConvertToCatalog={convertToCatalog}
          onBulkDelete={handleBulkDeleteClick}
          selectedCount={selectedIds.length}
          loading={loading || categoriesLoading}
          error={error}
          categories={categories}
        />
      </div>

      {/* Pagination - Fixed at bottom */}
      <div className="flex-shrink-0">
        <TablePagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
          loading={loading}
        />
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Подтверждение удаления"
        message={`Вы уверены, что хотите удалить ${selectedIds.length} выбранных черновиков? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
