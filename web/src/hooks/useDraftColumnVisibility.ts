import type { VisibilityState } from '@tanstack/react-table';
import * as React from 'react';

export function useDraftColumnVisibility(status?: string) {
  const defaultColumnVisibility: VisibilityState = React.useMemo(
    () => ({
      article: true, // Always visible
      category: status === 'approved',
      gptRequest: false,
      gptResponse: false,
      gptRequest2: false,
      gptResponse2: false,
      createdAt: false,
      updatedAt: false,
    }),
    [status]
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility);

  // Force category visibility for approved status
  const finalColumnVisibility = React.useMemo(() => {
    if (status === 'approved') {
      return { ...columnVisibility, category: true };
    }
    return columnVisibility;
  }, [columnVisibility, status]);

  const handleToggleColumn = React.useCallback(
    (columnId: string) => {
      setColumnVisibility(prev => {
        const newVisibility = {
          ...prev,
          [columnId]: !prev[columnId],
        };

        // For approved status, always keep category visible
        if (status === 'approved' && columnId === 'category') {
          newVisibility.category = true;
        }

        return newVisibility;
      });
    },
    [status]
  );

  const resetColumnVisibility = React.useCallback(() => {
    setColumnVisibility(defaultColumnVisibility);
  }, [defaultColumnVisibility]);

  return {
    columnVisibility: finalColumnVisibility,
    setColumnVisibility,
    handleToggleColumn,
    resetColumnVisibility,
  };
}
