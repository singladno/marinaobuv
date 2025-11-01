import * as React from 'react';

import type { ProductUpdateData } from '@/types/product';

import { useProductStateManager } from './useProductStateManager';

export interface ProductOperation {
  id: string;
  type: 'update' | 'delete';
  data: any;
  timestamp: number;
}

export interface UseProductOperationsProps {
  onUpdate: (id: string, data: ProductUpdateData) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

export function useProductOperations({
  onUpdate,
  onDelete,
}: UseProductOperationsProps) {
  const { state, actions } = useProductStateManager();
  const [operationQueue, setOperationQueue] = React.useState<
    ProductOperation[]
  >([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Process operations queue
  const processQueue = React.useCallback(async () => {
    if (isProcessing || operationQueue.length === 0) return;

    setIsProcessing(true);
    const currentOperation = operationQueue[0];

    try {
      switch (currentOperation.type) {
        case 'update':
          const updatedProduct = await onUpdate(
            currentOperation.id,
            currentOperation.data
          );
          // Update the local state with the server response
          if (updatedProduct) {
            actions.updateProduct(currentOperation.id, updatedProduct);
          }
          actions.clearOptimisticUpdate(currentOperation.id);
          break;
        case 'delete':
          await onDelete(currentOperation.id);
          break;
      }

      // Remove completed operation from queue
      setOperationQueue(prev => prev.slice(1));
    } catch (error) {
      console.error('Operation failed:', error);
      // Revert optimistic update on error
      if (currentOperation.type === 'update') {
        actions.clearOptimisticUpdate(currentOperation.id);
      }
      // For delete operations, we need to restore the product
      if (currentOperation.type === 'delete') {
        // Note: We would need to restore the product here, but since we don't have
        // the original data, we'll just clear any pending state
        console.warn(
          'Delete operation failed - product may need to be restored'
        );
      }
      // Remove failed operation from queue
      setOperationQueue(prev => prev.slice(1));
    } finally {
      actions.setPendingOperation(currentOperation.id, false);
      setIsProcessing(false);
    }
  }, [isProcessing, operationQueue, onUpdate, onDelete, actions]);

  // Process queue when it changes
  React.useEffect(() => {
    processQueue();
  }, [processQueue]);

  const addOperation = React.useCallback(
    (operation: Omit<ProductOperation, 'timestamp'>) => {
      const newOperation: ProductOperation = {
        ...operation,
        timestamp: Date.now(),
      };

      setOperationQueue(prev => [...prev, newOperation]);
      actions.setPendingOperation(operation.id, true);
    },
    [actions]
  );

  const updateProduct = React.useCallback(
    async (id: string, updates: ProductUpdateData) => {
      // Align behavior with orders: for certain fields, avoid optimistic UI
      const nonOptimisticKeys = new Set([
        'isActive',
        'categoryId',
        'gender',
        'season',
      ]);

      const hasNonOptimisticKey = Object.keys(updates).some(key =>
        nonOptimisticKeys.has(key)
      );

      if (hasNonOptimisticKey) {
        // Process immediately via queue but without optimistic overlay
        addOperation({
          id,
          type: 'update',
          data: updates,
        });
        return;
      }

      // Default: apply optimistic update immediately (includes sizes)
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

  const deleteProduct = React.useCallback(
    async (id: string) => {
      // Remove from UI immediately
      actions.removeProduct(id);

      // Add to operation queue
      addOperation({
        id,
        type: 'delete',
        data: {},
      });
    },
    [actions, addOperation]
  );

  const bulkUpdate = React.useCallback(
    async (updates: Array<{ id: string; data: ProductUpdateData }>) => {
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
      ids.forEach(id => actions.removeProduct(id));

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
    return state.data.map(product => {
      const optimisticUpdate = state.optimisticUpdates.get(product.id);
      return optimisticUpdate ? { ...product, ...optimisticUpdate } : product;
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
    updateProduct,
    deleteProduct,
    bulkUpdate,
    bulkDelete,
  };
}
