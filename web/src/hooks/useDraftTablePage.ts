import * as React from 'react';
import { useDrafts } from '@/hooks/useDrafts';
import { useCategories } from '@/hooks/useCategories';
import { useAIStatus } from '@/hooks/useAIStatus';
import { useDraftBulkOperations } from '@/hooks/useDraftBulkOperations';
import { useDraftsTableNew } from '@/hooks/useDraftsTableNew';
import type { Draft } from '@/types/admin';

export function useDraftTablePage(initialStatus: string) {
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

  // Use bulk operations hook first to get isRunningAI state
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
    isRunningAI,
    approve,
    convertToCatalog,
    handleBulkDeleteConfirm,
    handleBulkRestoreConfirm,
    handleBulkPermanentDeleteConfirm,
    runAIAnalysis,
  } = useDraftBulkOperations();

  const {
    currentProcessingDraft,
    isProcessing,
    data: aiStatusData,
    refetch: refetchAIStatus,
  } = useAIStatus(status, isRunningAI);

  // Set initial status from URL params only on mount
  React.useEffect(() => {
    if (initialStatus && initialStatus !== status) {
      setStatus(initialStatus);
    }
  }, [initialStatus, setStatus, status]);

  // Merge AI status data with main data
  const mergedData = React.useMemo(() => {
    if (!aiStatusData?.drafts || isTabChanging) {
      return data;
    }

    return data.map(draft => {
      const aiDraft = aiStatusData.drafts.find(ad => ad.id === draft.id);
      if (aiDraft) {
        return {
          ...draft,
          aiStatus: aiDraft.aiStatus,
          aiProcessedAt: aiDraft.aiProcessedAt,
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

  return {
    // Data
    data: mergedData,
    loading: loading || categoriesLoading,
    error,
    categories,
    status,
    pagination,
    goToPage,
    changePageSize,

    // Table
    table,
    selectedIds: newSelectedIds,

    // AI Status
    currentProcessingDraft,
    isProcessing,
    refetchAIStatus,

    // Bulk Operations
    showDeleteModal,
    setShowDeleteModal,
    showRestoreModal,
    setShowRestoreModal,
    showPermanentDeleteModal,
    setShowPermanentDeleteModal,
    isDeleting,
    isRestoring,
    isPermanentlyDeleting,
    isRunningAI,
    approve,
    convertToCatalog,
    handleBulkDeleteConfirm,
    handleBulkRestoreConfirm,
    handleBulkPermanentDeleteConfirm,
    runAIAnalysis,

    // Actions
    reload,
  };
}
