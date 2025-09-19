'use client';

import * as React from 'react';

import { DraftsTable } from '@/components/features/DraftsTable';
import type { Draft } from '@/types/admin';
import { useDrafts } from '@/hooks/useDrafts';
import { useCategories } from '@/hooks/useCategories';
import { useAIStatus } from '@/hooks/useAIStatus';
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
  const [showRestoreModal, setShowRestoreModal] = React.useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] =
    React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] =
    React.useState(false);
  const [isRunningAI, setIsRunningAI] = React.useState(false);

  const {
    currentProcessingDraft,
    isProcessing,
    data: aiStatusData,
    refetch: refetchAIStatus,
  } = useAIStatus(status, isRunningAI);
  const selectedIds = React.useMemo(
    () => Object.keys(selected).filter(k => selected[k]),
    [selected]
  );

  // Merge table data with AI status data to show real-time AI status
  const mergedData = React.useMemo(() => {
    if (!aiStatusData?.drafts) return data;

    const aiStatusMap = new Map(
      aiStatusData.drafts.map(draft => [draft.id, draft])
    );

    return data.map(draft => {
      const aiStatus = aiStatusMap.get(draft.id);
      if (aiStatus) {
        return {
          ...draft,
          aiStatus: aiStatus.aiStatus,
          aiProcessedAt: aiStatus.aiProcessedAt,
        };
      }
      return draft;
    });
  }, [data, aiStatusData]);

  const toggle = React.useCallback((id: string) => {
    setSelected((m: Record<string, boolean>) => ({ ...m, [id]: !m[id] }));
  }, []);

  const selectAll = React.useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        // Select all items
        const allSelected = mergedData.reduce(
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
    [mergedData]
  );

  const inlinePatch = React.useCallback(
    async (id: string, patch: Partial<Draft>) => {
      await fetch(`/api/admin/drafts`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ id, data: patch }),
      });
      // Only reload for non-size updates to avoid race conditions with optimistic updates
      if (!('sizes' in patch)) {
        await reloadSilent();
      }
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

  const handleBulkRestoreClick = () => {
    setShowRestoreModal(true);
  };

  const handleBulkRestoreConfirm = async () => {
    setIsRestoring(true);

    try {
      const res = await fetch(`/api/admin/drafts/bulk-restore`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        addNotification({
          type: 'error',
          title: 'Ошибка при восстановлении',
          message: errorText,
        });
        return;
      }

      const result = await res.json();
      addNotification({
        type: 'success',
        title: 'Успешно восстановлено',
        message: `Восстановлено ${result.count} черновиков`,
      });

      await reload();
      setSelected({});
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка при восстановлении',
        message: 'Произошла неожиданная ошибка',
      });
    } finally {
      setIsRestoring(false);
      setShowRestoreModal(false);
    }
  };

  const handleBulkPermanentDeleteClick = () => {
    setShowPermanentDeleteModal(true);
  };

  const handleBulkPermanentDeleteConfirm = async () => {
    setIsPermanentlyDeleting(true);

    try {
      const res = await fetch(`/api/admin/drafts/bulk-permanent-delete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        addNotification({
          type: 'error',
          title: 'Ошибка при удалении навсегда',
          message: errorText,
        });
        return;
      }

      const result = await res.json();
      addNotification({
        type: 'success',
        title: 'Успешно удалено навсегда',
        message: `Удалено навсегда ${result.count} черновиков`,
      });

      await reload();
      setSelected({});
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка при удалении навсегда',
        message: 'Произошла неожиданная ошибка',
      });
    } finally {
      setIsPermanentlyDeleting(false);
      setShowPermanentDeleteModal(false);
    }
  };

  const runAIAnalysis = async () => {
    setIsRunningAI(true);

    try {
      // Use only selected drafts for AI analysis
      const draftIds = selectedIds;

      if (draftIds.length === 0) {
        addNotification({
          type: 'warning',
          title: 'Нет выбранных товаров',
          message: 'Выберите товары для запуска AI анализа',
        });
        return;
      }

      const res = await fetch(`/api/admin/drafts/run-ai-analysis`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ draftIds }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        addNotification({
          type: 'error',
          title: 'Ошибка при запуске AI анализа',
          message: errorText,
        });
        return;
      }

      const result = await res.json();
      addNotification({
        type: 'success',
        title: 'AI анализ запущен',
        message: `Запущен анализ ${draftIds.length} товаров`,
      });

      // Reload data to show updated AI status immediately
      await reload();

      // Also refetch AI status to get immediate updates
      await refetchAIStatus();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка при запуске AI анализа',
        message: 'Произошла неожиданная ошибка',
      });
    } finally {
      setIsRunningAI(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Table with reserved space for pagination */}
      <div className="min-h-0 flex-1">
        <DraftsTable
          data={mergedData}
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
          onBulkRestore={handleBulkRestoreClick}
          onBulkPermanentDelete={handleBulkPermanentDeleteClick}
          onRunAIScript={runAIAnalysis}
          selectedCount={selectedIds.length}
          loading={loading || categoriesLoading}
          error={error}
          categories={categories}
          isRunningAI={isRunningAI || isProcessing}
          currentProcessingDraft={currentProcessingDraft}
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

      <ConfirmationModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={handleBulkRestoreConfirm}
        title="Подтверждение восстановления"
        message={`Вы уверены, что хотите восстановить ${selectedIds.length} выбранных черновиков?`}
        confirmText="Восстановить"
        cancelText="Отмена"
        variant="info"
        isLoading={isRestoring}
      />

      <ConfirmationModal
        isOpen={showPermanentDeleteModal}
        onClose={() => setShowPermanentDeleteModal(false)}
        onConfirm={handleBulkPermanentDeleteConfirm}
        title="Подтверждение удаления навсегда"
        message={`Вы уверены, что хотите удалить навсегда ${selectedIds.length} выбранных черновиков? Это действие нельзя отменить и данные будут потеряны навсегда.`}
        confirmText="Удалить навсегда"
        cancelText="Отмена"
        variant="danger"
        isLoading={isPermanentlyDeleting}
      />
    </div>
  );
}
