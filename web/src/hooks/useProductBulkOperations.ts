import { useState, useCallback } from 'react';

import type { Product } from '@/types/product';

interface UseProductBulkOperationsReturn {
  selected: Record<string, boolean>;
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggle: (id: string) => void;
  onSelectAll: (selectAll: boolean) => void;
  onBulkDelete: () => Promise<void>;
  onBulkActivate: () => Promise<void>;
  onBulkDeactivate: () => Promise<void>;
  clearSelection: () => void;
}

export function useProductBulkOperations(
  products: Product[],
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>,
  onDeleteProduct: (id: string) => Promise<void>
): UseProductBulkOperationsReturn {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = products.length > 0 && selectedCount === products.length;
  const someSelected = selectedCount > 0 && selectedCount < products.length;

  const onToggle = useCallback((id: string) => {
    setSelected(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const onSelectAll = useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        const newSelected: Record<string, boolean> = {};
        products.forEach(product => {
          newSelected[product.id] = true;
        });
        setSelected(newSelected);
      } else {
        setSelected({});
      }
    },
    [products]
  );

  const clearSelection = useCallback(() => {
    setSelected({});
  }, []);

  const onBulkDelete = useCallback(async () => {
    const selectedIds = Object.entries(selected)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) return;

    if (
      window.confirm(
        `Вы уверены, что хотите удалить ${selectedIds.length} товаров?`
      )
    ) {
      try {
        await Promise.all(selectedIds.map(id => onDeleteProduct(id)));
      } catch (error) {
        console.error('Error bulk deleting products:', error);
        throw error; // Re-throw to let the caller handle the error
      } finally {
        clearSelection(); // Always clear selection regardless of success/failure
      }
    }
  }, [selected, onDeleteProduct, clearSelection]);

  const onBulkActivate = useCallback(async () => {
    const selectedIds = Object.entries(selected)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map(id => onUpdateProduct(id, { isActive: true }))
      );
    } catch (error) {
      console.error('Error bulk activating products:', error);
      throw error; // Re-throw to let the caller handle the error
    } finally {
      clearSelection(); // Always clear selection regardless of success/failure
    }
  }, [selected, onUpdateProduct, clearSelection]);

  const onBulkDeactivate = useCallback(async () => {
    const selectedIds = Object.entries(selected)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map(id => onUpdateProduct(id, { isActive: false }))
      );
    } catch (error) {
      console.error('Error bulk deactivating products:', error);
      throw error; // Re-throw to let the caller handle the error
    } finally {
      clearSelection(); // Always clear selection regardless of success/failure
    }
  }, [selected, onUpdateProduct, clearSelection]);

  return {
    selected,
    selectedCount,
    allSelected,
    someSelected,
    onToggle,
    onSelectAll,
    onBulkDelete,
    onBulkActivate,
    onBulkDeactivate,
    clearSelection,
  };
}
