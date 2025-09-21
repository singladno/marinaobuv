import React from 'react';
import { ApprovalLoader } from '@/components/ui/ApprovalLoader';
// import { useApprovalEvents } from '@/hooks/useApprovalEvents';

interface ApprovalSelectionCellProps {
  id: string;
  selected: boolean;
  onToggle: (id: string) => void;
}

export const ApprovalSelectionCell = React.memo(
  ({ id, selected, onToggle }: ApprovalSelectionCellProps) => {
    // SSE disabled to fix navigation issues
    // const { getApprovalState } = useApprovalEvents([id]);
    const getApprovalState = () => ({
      isProcessing: false,
      currentImage: 0,
      totalImages: 0,
      progress: 0,
      status: 'idle' as const,
    });
    const approvalState = getApprovalState(id);

    const handleChange = React.useCallback(() => {
      if (!approvalState.isProcessing) {
        onToggle(id);
      }
    }, [id, onToggle, approvalState.isProcessing]);

    // If processing, show loader instead of checkbox
    if (approvalState.isProcessing) {
      return (
        <div className="flex h-full items-center justify-center">
          <ApprovalLoader
            status={approvalState.status}
            progress={approvalState.progress}
            currentImage={approvalState.currentImage}
            totalImages={approvalState.totalImages}
            className="h-8 w-8"
          />
        </div>
      );
    }

    // Normal checkbox for non-processing items
    return (
      <div className="flex h-full items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={handleChange}
          aria-label="Выбрать черновик"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
        />
      </div>
    );
  }
);

ApprovalSelectionCell.displayName = 'ApprovalSelectionCell';
