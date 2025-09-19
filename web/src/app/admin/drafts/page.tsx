'use client';

import { DraftsTable } from '@/components/features/DraftsTable';
import type { Draft } from '@/types/admin';
import { useDrafts } from '@/hooks/useDrafts';
import { useCategories } from '@/hooks/useCategories';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useMemo, useState } from 'react';

export default function AdminDraftsPage() {
  const { data, loading, error, reload, reloadSilent, status, setStatus } =
    useDrafts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { addNotification } = useNotifications();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedIds = useMemo(
    () => Object.keys(selected).filter(k => selected[k]),
    [selected]
  );

  const toggle = (id: string) => setSelected(m => ({ ...m, [id]: !m[id] }));
  const inlinePatch = async (id: string, patch: Partial<Draft>) => {
    await fetch(`/api/admin/drafts`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
      body: JSON.stringify({ id, data: patch }),
    });
    // Avoid global loader; refresh in background
    await reloadSilent();
  };
  const approve = async () => {
    const categoryId = prompt('Category ID to place products into:');
    if (!categoryId) return;

    try {
      const res = await fetch(`/api/admin/drafts/approve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ ids: selectedIds, categoryId }),
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
      <DraftsTable
        data={data}
        selected={selected}
        onToggle={toggle}
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
