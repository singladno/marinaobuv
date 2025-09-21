import React from 'react';
import { ApprovalSelectionCell } from './ApprovalSelectionCell';
import { useApprovalEvents } from '@/hooks/useApprovalEvents';

interface ApprovalSelectionCellWithEventsProps {
  id: string;
  selected: boolean;
  onToggle: (id: string) => void;
  draftIds: string[];
}

export const ApprovalSelectionCellWithEvents = React.memo(
  ({
    id,
    selected,
    onToggle,
    draftIds,
  }: ApprovalSelectionCellWithEventsProps) => {
    const { getApprovalState } = useApprovalEvents(draftIds);
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
