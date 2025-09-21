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
    refetchAIStatus,
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
    reload,
  } = useDraftTablePage(initialStatus);

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
            runAIAnalysis(newSelectedIds, reload, refetchAIStatus, status)
          }
          isRunningAI={isRunningAI}
          isProcessing={isProcessing}
          currentProcessingDraft={currentProcessingDraft}
        />
      </div>

      {/* Table with reserved space for pagination */}
      <div className="min-h-0 flex-1">
        <UnifiedDataTable
          table={table}
          onPatch={async () => {}}
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
            runAIAnalysis(newSelectedIds, reload, refetchAIStatus, status)
          }
          loading={loading}
          error={error}
          data={data}
          categories={categories}
          pagination={pagination}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
          isDraftTable={true}
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
          handleBulkDeleteConfirm(newSelectedIds, reload, () => {})
        }
        onBulkRestoreConfirm={() =>
          handleBulkRestoreConfirm(newSelectedIds, reload, () => {})
        }
        onBulkPermanentDeleteConfirm={() =>
          handleBulkPermanentDeleteConfirm(newSelectedIds, reload, () => {})
        }
        isDeleting={isDeleting}
        isRestoring={isRestoring}
        isPermanentlyDeleting={isPermanentlyDeleting}
      />
    </div>
  );
}
