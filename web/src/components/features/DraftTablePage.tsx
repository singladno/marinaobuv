'use client';

import * as React from 'react';

import { useDraftBulkOperations } from '@/hooks/useDraftBulkOperations';
import { useDraftsTableNew } from '@/hooks/useDraftsTableNew';
import { useDrafts } from '@/hooks/useDrafts';
import { useCategories } from '@/hooks/useCategories';
import { useAIStatus } from '@/hooks/useAIStatus';
import type { Draft } from '@/types/admin';

import { DraftBulkOperations } from './DraftBulkOperations';
import { DraftConfirmationModals } from './DraftConfirmationModals';
import { UnifiedDataTable } from './UnifiedDataTable';

interface DraftTablePageProps {
  initialStatus: string;
  onStatusChange: (newStatus: string | undefined) => void;
  searchParams: URLSearchParams;
  router: any;
}

export function DraftTablePage({
  initialStatus,
  onStatusChange,
}: DraftTablePageProps) {
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
  const [isTabChanging, setIsTabChanging] = React.useState(false);

  const {
    currentProcessingDraft,
    isProcessing,
    data: aiStatusData,
    refetch: refetchAIStatus,
  } = useAIStatus(status, false);

  // Set initial status from URL params only on mount
  React.useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus, setStatus]);

  // Clear tab changing state when data loads
  React.useEffect(() => {
    if (!loading && isTabChanging) {
      setIsTabChanging(false);
    }
  }, [loading, isTabChanging]);

  // Merge table data with AI status data to show real-time AI status
  const mergedData = React.useMemo(() => {
    // Don't show data if we're changing tabs to prevent flicker
    if (isTabChanging) return [];

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
  }, [data, aiStatusData, isTabChanging]);

  const inlinePatch = React.useCallback(
    async (id: string, patch: Partial<Draft>) => {
      // Transform sizes data to database format
      if (patch.sizes) {
        const transformedSizes = patch.sizes.map(size => ({
          size: size.size,
          stock: size.quantity,
          count: size.quantity,
        }));
        patch = { ...patch, sizes: transformedSizes };
      }

      await fetch(`/api/admin/drafts`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
        body: JSON.stringify({ id, data: patch }),
      });
      // Don't reload for size or image updates as they are handled optimistically
      // Only reload for other field changes that might affect the display
      if (!('sizes' in patch) && !('images' in patch)) {
        await reloadSilent();
      }
    },
    [reloadSilent]
  );

  const deleteDraft = async (id: string) => {
    try {
      await fetch('/api/admin/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isDeleted: true,
        }),
      });
      await reload();
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const toggleImage = async (imageId: string, isActive: boolean) => {
    const response = await fetch(`/api/admin/drafts/images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update image status: ${response.status}`);
    }

    // No reload needed - images are handled optimistically
    return response.json();
  };

  // Use the new useDraftsTableNew hook
  const { table, selectedIds: newSelectedIds } = useDraftsTableNew({
    data: mergedData,
    onPatch: inlinePatch,
    onDelete: deleteDraft,
    onImageToggle: toggleImage,
    categories,
    onReload: reload,
    status,
  });

  // Use bulk operations hook
  const {
    showDeleteModal,
    setShowDeleteModal,
    showRestoreModal,
    setShowRestoreModal,
    showPermanentDeleteModal,
    setShowPermanentDeleteModal,
    isDeleting,
    isRestoring,
    isPermanentlyDeleting,
    approve,
    convertToCatalog,
    handleBulkDeleteConfirm,
    handleBulkRestoreConfirm,
    handleBulkPermanentDeleteConfirm,
    runAIAnalysis,
  } = useDraftBulkOperations();

  return (
    <div className="flex h-full flex-col">
      {/* Bulk Operations */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <DraftBulkOperations
          selectedIds={newSelectedIds}
          status={status}
          onApprove={() => approve(newSelectedIds, reload, () => {})}
          onConvertToCatalog={() =>
            convertToCatalog(newSelectedIds, reload, () => {})
          }
          onBulkDelete={() => setShowDeleteModal(true)}
          onBulkRestore={() => setShowRestoreModal(true)}
          onBulkPermanentDelete={() => setShowPermanentDeleteModal(true)}
          onRunAIScript={() =>
            runAIAnalysis(newSelectedIds, reload, refetchAIStatus)
          }
          isRunningAI={false}
          isProcessing={isProcessing}
          currentProcessingDraft={currentProcessingDraft}
        />
      </div>

      {/* Table with reserved space for pagination */}
      <div className="min-h-0 flex-1">
        <UnifiedDataTable
          table={table}
          onPatch={inlinePatch}
          status={status}
          onStatusChange={onStatusChange}
          onReload={reload}
          onApprove={() => approve(newSelectedIds, reload, () => {})}
          onConvertToCatalog={() =>
            convertToCatalog(newSelectedIds, reload, () => {})
          }
          onBulkDelete={() => setShowDeleteModal(true)}
          onBulkRestore={() => setShowRestoreModal(true)}
          onBulkPermanentDelete={() => setShowPermanentDeleteModal(true)}
          onRunAIScript={() =>
            runAIAnalysis(newSelectedIds, reload, refetchAIStatus)
          }
          selectedCount={newSelectedIds.length}
          loading={loading || categoriesLoading || isTabChanging}
          error={error}
          categories={categories}
          isRunningAI={isProcessing}
          currentProcessingDraft={currentProcessingDraft}
          isDraftTable={true}
          pagination={pagination}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
          emptyMessage="Черновики не найдены"
          loadingMessage="Загрузка черновиков..."
        />
      </div>

      {/* Confirmation Modals */}
      <DraftConfirmationModals
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        showRestoreModal={showRestoreModal}
        setShowRestoreModal={setShowRestoreModal}
        showPermanentDeleteModal={showPermanentDeleteModal}
        setShowPermanentDeleteModal={setShowPermanentDeleteModal}
        selectedCount={newSelectedIds.length}
        onBulkDeleteConfirm={() =>
          handleBulkDeleteConfirm(newSelectedIds, reload, () => setSelected({}))
        }
        onBulkRestoreConfirm={() =>
          handleBulkRestoreConfirm(newSelectedIds, reload, () =>
            setSelected({})
          )
        }
        onBulkPermanentDeleteConfirm={() =>
          handleBulkPermanentDeleteConfirm(newSelectedIds, reload, () =>
            setSelected({})
          )
        }
        isDeleting={isDeleting}
        isRestoring={isRestoring}
        isPermanentlyDeleting={isPermanentlyDeleting}
      />
    </div>
  );
}
