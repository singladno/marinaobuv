import { useState, useCallback } from 'react';

interface ItemApprovalState {
  approvedItems: Set<string>;
  isApproving: boolean;
}

export function useItemApprovals() {
  const [state, setState] = useState<ItemApprovalState>({
    approvedItems: new Set(),
    isApproving: false,
  });

  const approveItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      approvedItems: new Set([...prev.approvedItems, itemId]),
    }));
  }, []);

  const isItemApproved = useCallback(
    (itemId: string) => {
      return state.approvedItems.has(itemId);
    },
    [state.approvedItems]
  );

  const setApproving = useCallback((isApproving: boolean) => {
    setState(prev => ({ ...prev, isApproving }));
  }, []);

  const resetApprovals = useCallback(() => {
    setState({
      approvedItems: new Set(),
      isApproving: false,
    });
  }, []);

  return {
    approvedItems: state.approvedItems,
    isApproving: state.isApproving,
    approveItem,
    isItemApproved,
    setApproving,
    resetApprovals,
  };
}
