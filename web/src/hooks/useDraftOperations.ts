import * as React from 'react';

import type { Draft } from '@/types/admin';

import { useDraftStateManager } from './useDraftStateManager';

export interface DraftOperation {
  id: string;
  type: 'update' | 'delete' | 'imageToggle';
  data: any;
  timestamp: number;
}

export interface UseDraftOperationsProps {
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
}

export function useDraftOperations({
  onPatch,
  onDelete,
  onImageToggle,
}: UseDraftOperationsProps) {
  const { state, actions } = useDraftStateManager();
  const [operationQueue, setOperationQueue] = React.useState<DraftOperation[]>(
    []
  );
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Process operations queue
  const processQueue = React.useCallback(async () => {
    if (isProcessing || operationQueue.length === 0) return;

    setIsProcessing(true);
    const currentOperation = operationQueue[0];

    try {
      switch (currentOperation.type) {
        case 'update':
          await onPatch(currentOperation.id, currentOperation.data);
          actions.clearOptimisticUpdate(currentOperation.id);
          break;
        case 'delete':
          await onDelete(currentOperation.id);
          break;
        case 'imageToggle':
          await onImageToggle(
            currentOperation.data.imageId,
            currentOperation.data.isActive
          );
          // Don't clear optimistic update immediately - wait for external data to be updated
          // The optimistic update will be cleared when the external data is synced
          break;
      }

      // Remove completed operation from queue
      setOperationQueue(prev => prev.slice(1));
    } catch (error) {
      console.error('Operation failed:', error);
      // Revert optimistic update on error
      if (
        currentOperation.type === 'update' ||
        currentOperation.type === 'imageToggle'
      ) {
        actions.clearOptimisticUpdate(currentOperation.id);
      }
      // For delete operations, we need to restore the draft
      if (currentOperation.type === 'delete') {
        // Note: We would need to restore the draft here, but since we don't have
        // the original data, we'll just clear any pending state
        console.warn('Delete operation failed - draft may need to be restored');
      }
      // Remove failed operation from queue
      setOperationQueue(prev => prev.slice(1));
    } finally {
      actions.setPendingOperation(currentOperation.id, false);
      setIsProcessing(false);
    }
  }, [isProcessing, operationQueue, onPatch, onDelete, onImageToggle, actions]);

  // Process queue when it changes
  React.useEffect(() => {
    processQueue();
  }, [processQueue]);

  const addOperation = React.useCallback(
    (operation: Omit<DraftOperation, 'timestamp'>) => {
      const newOperation: DraftOperation = {
        ...operation,
        timestamp: Date.now(),
      };

      setOperationQueue(prev => [...prev, newOperation]);
      actions.setPendingOperation(operation.id, true);
    },
    [actions]
  );

  const updateDraft = React.useCallback(
    async (id: string, updates: Partial<Draft>) => {
      // Apply optimistic update immediately
      actions.setOptimisticUpdate(id, updates);

      // Add to operation queue
      addOperation({
        id,
        type: 'update',
        data: updates,
      });
    },
    [actions, addOperation]
  );

  const deleteDraft = React.useCallback(
    async (id: string) => {
      // Remove from UI immediately
      actions.removeDraft(id);

      // Add to operation queue
      addOperation({
        id,
        type: 'delete',
        data: {},
      });
    },
    [actions, addOperation]
  );

  const toggleImage = React.useCallback(
    async (imageId: string, isActive: boolean) => {
      // Find the draft that contains this image
      const draft = state.data.find(d =>
        d.images.some(img => img.id === imageId)
      );

      if (!draft) return;

      // Apply optimistic update to image
      const updatedImages = draft.images.map(img =>
        img.id === imageId ? { ...img, isActive } : img
      );

      actions.setOptimisticUpdate(draft.id, { images: updatedImages });

      // Add to operation queue
      addOperation({
        id: draft.id,
        type: 'imageToggle',
        data: { imageId, isActive },
      });
    },
    [state.data, actions, addOperation]
  );

  const bulkUpdate = React.useCallback(
    async (updates: Array<{ id: string; data: Partial<Draft> }>) => {
      // Apply all optimistic updates
      updates.forEach(({ id, data }) => {
        actions.setOptimisticUpdate(id, data);
        addOperation({
          id,
          type: 'update',
          data,
        });
      });
    },
    [actions, addOperation]
  );

  const bulkDelete = React.useCallback(
    async (ids: string[]) => {
      // Remove all from UI immediately
      ids.forEach(id => actions.removeDraft(id));

      // Add all to operation queue
      ids.forEach(id => {
        addOperation({
          id,
          type: 'delete',
          data: {},
        });
      });
    },
    [actions, addOperation]
  );

  const dataWithOptimisticUpdates = React.useMemo(() => {
    return state.data.map(draft => {
      const optimisticUpdate = state.optimisticUpdates.get(draft.id);
      return optimisticUpdate ? { ...draft, ...optimisticUpdate } : draft;
    });
  }, [state.data, state.optimisticUpdates]);

  return {
    // State
    state,
    actions,
    operationQueue,
    isProcessing,
    dataWithOptimisticUpdates,

    // Operations
    updateDraft,
    deleteDraft,
    toggleImage,
    bulkUpdate,
    bulkDelete,
  };
}
