import { useDraftBulkOperations } from './useDraftBulkOperations';
import { useDraftsTableNew } from './useDraftsTableNew';
import { useDraftTableData } from './useDraftTableData';
import { useDraftTableOperations } from './useDraftTableOperations';

export function useDraftTablePage(initialStatus: string) {
  const data = useDraftTableData(initialStatus);
  const operations = useDraftTableOperations({
    reload: data.reload,
    reloadSilent: data.reloadSilent,
  });

  // Use bulk operations hook first to get isRunningAI state
  const bulkOps = useDraftBulkOperations();

  const currentProcessingDraft = null;
  const isProcessing = false;

  // Use the new useDraftsTableNew hook
  const {
    table,
    selectedIds: newSelectedIds,
    clearSelection,
  } = useDraftsTableNew({
    data: data.data,
    onPatch: operations.inlinePatch,
    onDelete: operations.deleteDraft,
    onImageToggle: operations.toggleImage,
    categories: data.categories,
    onReload: data.reload,
    status: data.status,
  });

  return {
    // Data
    data: data.data,
    loading: data.loading,
    error: data.error,
    categories: data.categories,
    status: data.status,
    pagination: data.pagination,
    goToPage: data.goToPage,
    changePageSize: data.changePageSize,

    // Table
    table,
    selectedIds: newSelectedIds,

    // Status
    currentProcessingDraft,
    isProcessing,

    // Bulk Operations
    showDeleteModal: bulkOps.showDeleteModal,
    setShowDeleteModal: bulkOps.setShowDeleteModal,
    showRestoreModal: bulkOps.showRestoreModal,
    setShowRestoreModal: bulkOps.setShowRestoreModal,
    showPermanentDeleteModal: bulkOps.showPermanentDeleteModal,
    setShowPermanentDeleteModal: bulkOps.setShowPermanentDeleteModal,
    isDeleting: bulkOps.isDeleting,
    isRestoring: bulkOps.isRestoring,
    isPermanentlyDeleting: bulkOps.isPermanentlyDeleting,
    approve: bulkOps.approve,
    convertToCatalog: bulkOps.convertToCatalog,
    handleBulkDeleteConfirm: bulkOps.handleBulkDeleteConfirm,
    handleBulkRestoreConfirm: bulkOps.handleBulkRestoreConfirm,
    handleBulkPermanentDeleteConfirm: bulkOps.handleBulkPermanentDeleteConfirm,
    // Actions
    reload: data.reload,
    clearSelection,
  };
}
