'use client';

import { DraftApprovalActions } from './DraftApprovalActions';
import { DraftDeletionActions } from './DraftDeletionActions';

interface DraftBulkOperationsProps {
  selectedIds: string[];
  status?: 'draft' | 'deleted' | 'approved' | string;
  onApprove: () => Promise<void>;
  onConvertToCatalog: () => Promise<void>;
  onBulkDelete: () => void;
  onBulkRestore: () => void;
  onBulkPermanentDelete: () => void;
  isProcessing: boolean;
}

export function DraftBulkOperations({
  selectedIds,
  status,
  onApprove,
  onConvertToCatalog,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  isProcessing,
}: DraftBulkOperationsProps) {
  const selectedCount = selectedIds.length;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-blue-50 px-6 py-4 dark:bg-blue-900/20">
      {status === 'draft' && (
        <DraftApprovalActions
          selectedCount={selectedCount}
          onApprove={onApprove}
          onConvertToCatalog={onConvertToCatalog}
          isProcessing={isProcessing}
        />
      )}

      {status === 'deleted' && (
        <DraftDeletionActions
          selectedCount={selectedCount}
          onBulkRestore={onBulkRestore}
          onBulkPermanentDelete={onBulkPermanentDelete}
        />
      )}

      {status === 'approved' && (
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-green-900 dark:text-green-100">
            {selectedCount} черновиков выбрано
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onBulkDelete}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
            >
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
