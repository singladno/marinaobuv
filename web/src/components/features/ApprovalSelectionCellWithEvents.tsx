import React from 'react';
import { ApprovalSelectionCell } from './ApprovalSelectionCell';
import { useApprovalEvents } from '@/contexts/ApprovalEventsContext';

interface ApprovalSelectionCellWithEventsProps {
  id: string;
  selected: boolean;
  onToggle: (id: string) => void;
}

export const ApprovalSelectionCellWithEvents = React.memo(
  ({ id, selected, onToggle }: ApprovalSelectionCellWithEventsProps) => {
    const { getApprovalState } = useApprovalEvents();
    const approvalState = getApprovalState(id);

    return (
      <ApprovalSelectionCell
        id={id}
        selected={selected}
        onToggle={onToggle}
        approvalState={approvalState}
      />
    );
  }
);

ApprovalSelectionCellWithEvents.displayName = 'ApprovalSelectionCellWithEvents';
