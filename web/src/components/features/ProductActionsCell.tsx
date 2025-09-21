'use client';

import React, { useState } from 'react';
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
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
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

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
  );
}
