'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';

import { ProductSourceModal } from '@/components/product/ProductSourceModal';
import { useUser } from '@/contexts/NextAuthUserContext';
import type { Product } from '@/types/product';

interface ProductActionsCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductActionsCell({
  product,
  onUpdateProduct,
}: ProductActionsCellProps) {
  const { user } = useUser();
  const [isToggling, setIsToggling] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
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
    <>
      <div className="flex w-full items-center justify-between">
        {/* Source button - only show for admin users if there are source messages */}
        {user?.role === 'ADMIN' &&
          product.sourceMessageIds &&
          product.sourceMessageIds.length > 0 && (
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="group shrink-0 cursor-pointer rounded focus:outline-none"
              title={`Просмотреть ${product.sourceMessageIds.length} источник${product.sourceMessageIds.length === 1 ? '' : product.sourceMessageIds.length < 5 ? 'а' : 'ов'}`}
              aria-label="Просмотреть источник"
            >
              {product.source === 'WA' ? (
                <Image
                  src="/images/whatsapp-icon.png"
                  alt="WhatsApp"
                  width={36}
                  height={36}
                  className="h-8 w-8 rounded transition-transform duration-200 group-hover:scale-110"
                  unoptimized
                />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
            </button>
          )}

        {/* Toggle switch for activation */}
        <button
          onClick={handleToggleActive}
          disabled={isToggling}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
            isActive ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          aria-label={isActive ? 'Деактивировать товар' : 'Активировать товар'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
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

    </>
  );
}
