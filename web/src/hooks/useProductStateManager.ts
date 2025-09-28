import * as React from 'react';

import type { Product } from '@/types/product';

interface ProductState {
  data: Product[];
  optimisticUpdates: Map<string, Partial<Product>>;
  pendingOperations: Set<string>;
}

interface ProductStateActions {
  setData: (data: Product[]) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  addProduct: (product: Product) => void;
  setOptimisticUpdate: (id: string, updates: Partial<Product>) => void;
  clearOptimisticUpdate: (id: string) => void;
  setPendingOperation: (id: string, pending: boolean) => void;
  reset: () => void;
}

const initialState: ProductState = {
  data: [],
  optimisticUpdates: new Map(),
  pendingOperations: new Set(),
};

export function useProductStateManager() {
  const [state, setState] = React.useState<ProductState>(initialState);

  const actions: ProductStateActions = React.useMemo(
    () => ({
      setData: (data: Product[]) => {
        setState(prev => ({
          ...prev,
          data,
        }));
      },

      updateProduct: (id: string, updates: Partial<Product>) => {
        setState(prev => ({
          ...prev,
          data: prev.data.map(product =>
            product.id === id ? { ...product, ...updates } : product
          ),
        }));
      },

      removeProduct: (id: string) => {
        setState(prev => ({
          ...prev,
          data: prev.data.filter(product => product.id !== id),
        }));
      },

      addProduct: (product: Product) => {
        setState(prev => ({
          ...prev,
          data: [...prev.data, product],
        }));
      },

      setOptimisticUpdate: (id: string, updates: Partial<Product>) => {
        setState(prev => {
          const newOptimisticUpdates = new Map(prev.optimisticUpdates);
          newOptimisticUpdates.set(id, updates);
          return {
            ...prev,
            optimisticUpdates: newOptimisticUpdates,
          };
        });
      },

      clearOptimisticUpdate: (id: string) => {
        setState(prev => {
          const newOptimisticUpdates = new Map(prev.optimisticUpdates);
          newOptimisticUpdates.delete(id);
          return {
            ...prev,
            optimisticUpdates: newOptimisticUpdates,
          };
        });
      },

      setPendingOperation: (id: string, pending: boolean) => {
        setState(prev => {
          const newPendingOperations = new Set(prev.pendingOperations);
          if (pending) {
            newPendingOperations.add(id);
          } else {
            newPendingOperations.delete(id);
          }
          return {
            ...prev,
            pendingOperations: newPendingOperations,
          };
        });
      },

      reset: () => {
        setState(initialState);
      },
    }),
    []
  );

  // Get product with optimistic updates applied
  const getProductWithOptimisticUpdates = React.useCallback(
    (product: Product): Product => {
      const optimisticUpdate = state.optimisticUpdates.get(product.id);
      if (!optimisticUpdate) return product;
      return { ...product, ...optimisticUpdate };
    },
    [state.optimisticUpdates]
  );

  // Get all products with optimistic updates applied
  const dataWithOptimisticUpdates = React.useMemo(
    () => state.data.map(getProductWithOptimisticUpdates),
    [state.data, getProductWithOptimisticUpdates]
  );

  return {
    state,
    actions,
    dataWithOptimisticUpdates,
  };
}
