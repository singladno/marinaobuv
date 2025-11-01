import { useState, useCallback, useTransition } from 'react';

import type { Product } from '@/types/product';
import { useConfirmationModal } from './useConfirmationModal';

interface UseProductBulkOperationsReturn {
  selected: Record<string, boolean>;
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggle: (id: string) => void;
  onSelectAll: (selectAll: boolean) => void;
  onBulkDelete: () => Promise<boolean>;
  onBulkActivate: () => Promise<void>;
  onBulkDeactivate: () => Promise<void>;
  clearSelection: () => void;
  confirmationModal: {
    isOpen: boolean;
    options: any;
    isLoading: boolean;
    handleConfirm: () => void;
    handleCancel: () => void;
    closeModal: () => void;
    setLoading: (loading: boolean) => void;
  };
}

export function useProductBulkOperations(
  products: Product[],
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>,
  onDeleteProduct: (id: string) => Promise<void>
): UseProductBulkOperationsReturn {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const confirmationModal = useConfirmationModal();

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = products.length > 0 && selectedCount === products.length;
  const someSelected = selectedCount > 0 && selectedCount < products.length;

  const onToggle = useCallback((id: string) => {
    // Use requestAnimationFrame to defer the state update outside of the click handler
    requestAnimationFrame(() => {
      startTransition(() => {
        setSelected(prev => {
          const currentValue = prev[id] ?? false;
          const newValue = !currentValue;
          // Return previous state if no change (shouldn't happen, but optimization)
          if (prev[id] === newValue) return prev;
          return {
            ...prev,
            [id]: newValue,
          };
        });
      });
    });
  }, [startTransition]);

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

  const onBulkDelete = useCallback(async (): Promise<boolean> => {
    const selectedIds = Object.entries(selected)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) return false;

    const confirmed = await confirmationModal.showConfirmation({
      title: 'Подтверждение удаления',
      message: `Вы уверены, что хотите удалить ${selectedIds.length} товаров? Это действие нельзя отменить.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        confirmationModal.setLoading(true);
        await Promise.all(selectedIds.map(id => onDeleteProduct(id)));
        clearSelection();
        return true;
      } catch (error) {
        console.error('Error bulk deleting products:', error);
        throw error; // Re-throw to let the caller handle the error
      } finally {
        confirmationModal.setLoading(false);
        confirmationModal.closeModal();
      }
    }

    return false;
  }, [selected, onDeleteProduct, clearSelection, confirmationModal]);

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
    confirmationModal,
  };
}
