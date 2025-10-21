'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

import { ProductSourceModal } from '@/components/product/ProductSourceModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useUser } from '@/contexts/UserContext';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import type { Product } from '@/types/product';

interface ProductActionsCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export function ProductActionsCell({
  product,
  onUpdateProduct,
  onDeleteProduct,
}: ProductActionsCellProps) {
  const { user } = useUser();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const confirmationModal = useConfirmationModal();
  const isActive = product.isActive;

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      await onUpdateProduct(product.id, { isActive: !isActive });
    } catch (error) {
      console.error('Error toggling product active status:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmationModal.showConfirmation({
      title: 'Подтверждение удаления',
      message: `Вы уверены, что хотите удалить товар "${product.name}"? Это действие нельзя отменить.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });

    if (confirmed) {
      setIsDeleting(true);
      try {
        await onDeleteProduct(product.id);
      } catch (error) {
        console.error('Error deleting product:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-center space-x-2">
        {/* Toggle switch for activation */}
        <button
          onClick={handleToggleActive}
          disabled={isToggling}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            isActive ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          aria-label={isActive ? 'Деактивировать товар' : 'Активировать товар'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>

        {/* Source button - only show for admin users if there are source messages */}
        {user?.role === 'ADMIN' &&
          product.sourceMessageIds &&
          product.sourceMessageIds.length > 0 && (
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="cursor-pointer rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              title={`Просмотреть ${product.sourceMessageIds.length} источник${product.sourceMessageIds.length === 1 ? '' : product.sourceMessageIds.length < 5 ? 'а' : 'ов'}`}
              aria-label="Просмотреть источник"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="cursor-pointer rounded p-1 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Удалить товар"
          aria-label="Удалить"
        >
          {isDeleting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Source Modal - only for admin users */}
      {user?.role === 'ADMIN' && (
        <ProductSourceModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
          productId={product.id}
          productName={product.name}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={confirmationModal.handleCancel}
        onConfirm={confirmationModal.handleConfirm}
        title={confirmationModal.options.title}
        message={confirmationModal.options.message}
        confirmText={confirmationModal.options.confirmText}
        cancelText={confirmationModal.options.cancelText}
        variant={confirmationModal.options.variant}
        isLoading={confirmationModal.isLoading}
      />
    </>
  );
}
