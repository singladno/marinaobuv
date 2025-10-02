'use client';

import * as React from 'react';

import { useDraftTablePage } from '@/hooks/useDraftTablePage';

import { DraftBulkOperations } from './DraftBulkOperations';
import { DraftConfirmationModals } from './DraftConfirmationModals';
import { UnifiedDataTable } from './UnifiedDataTable';

interface DraftTablePageProps {
  initialStatus: string;
  onStatusChange: (newStatus: string | undefined) => void;
  searchParams: URLSearchParams;
  router: unknown;
}

export function DraftTablePage({
  initialStatus,
  onStatusChange,
}: DraftTablePageProps) {
  const {
    data,
    loading,
    error,
    categories,
    status,
    pagination,
    goToPage,
    changePageSize,
    table,
    selectedIds: newSelectedIds,
    currentProcessingDraft,
    isProcessing,
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
    reload,
    clearSelection,
  } = useDraftTablePage(initialStatus);

  return (
    <div className="flex h-full flex-col">
      {/* Bulk Operations */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <DraftBulkOperations
          selectedIds={newSelectedIds}
          status={status}
          onApprove={() => approve(newSelectedIds, reload, clearSelection)}
          onConvertToCatalog={() =>
            convertToCatalog(newSelectedIds, reload, clearSelection)
          }
          onBulkDelete={() => setShowDeleteModal(true)}
          onBulkRestore={() => setShowRestoreModal(true)}
          onBulkPermanentDelete={() => setShowPermanentDeleteModal(true)}
          isProcessing={isProcessing}
        />
      </div>

      {/* Table with reserved space for pagination */}
      <div className="min-h-0 flex-1">
        <UnifiedDataTable
          table={table}
          loading={loading}
          error={error}
          data={data}
          pagination={pagination}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
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
          handleBulkDeleteConfirm(newSelectedIds, reload, clearSelection)
        }
        onBulkRestoreConfirm={() =>
          handleBulkRestoreConfirm(newSelectedIds, reload, clearSelection)
        }
        onBulkPermanentDeleteConfirm={() =>
          handleBulkPermanentDeleteConfirm(
            newSelectedIds,
            reload,
            clearSelection
          )
        }
        isDeleting={isDeleting}
        isRestoring={isRestoring}
        isPermanentlyDeleting={isPermanentlyDeleting}
      />
    </div>
  );
}
