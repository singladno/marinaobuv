'use client';

import React, { useState } from 'react';
import type { Product } from '@/types/product';

interface ProductActionsCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductActionsCell({
  product,
  onUpdateProduct,
}: ProductActionsCellProps) {
  const [isToggling, setIsToggling] = useState(false);
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

  return (
    <div className="flex items-center space-x-2">
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

      <span
        className={`text-xs font-medium ${
          isActive
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {isToggling ? '...' : isActive ? 'Активен' : 'Неактивен'}
      </span>
    </div>
  );
}
