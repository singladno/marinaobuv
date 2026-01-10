'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, Pencil, Hand } from 'lucide-react';

import { SourceMessagesModal } from '@/components/features/SourceMessagesModal';
import { useUser } from '@/contexts/NextAuthUserContext';
import type { Product } from '@/types/product';

interface ProductActionsCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  onEdit?: (productId: string) => void;
}

export function ProductActionsCell({
  product,
  onUpdateProduct,
  onEdit,
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
      <div className="flex w-full items-center justify-center gap-2">
        {/* Edit button - hidden on mobile/tablet/iPad (fields are inline editable), only show on desktop (>=1280px) */}
        {onEdit && (
          <button
            onClick={() => onEdit(product.id)}
            className="hidden xl:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-purple-500 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 cursor-pointer"
            title="Редактировать товар"
            aria-label="Редактировать товар"
          >
            <Pencil className="h-4 w-4 flex-shrink-0" />
          </button>
        )}

        {/* Source button - show for admin users */}
        {user?.role === 'ADMIN' && (
          <>
            {/* MANUAL icon - clickable if source screenshot exists */}
            {product.source === 'MANUAL' && (
              <>
                {product.sourceScreenshotUrl ? (
                  <button
                    onClick={() => setIsSourceModalOpen(true)}
                    className="group shrink-0 cursor-pointer rounded focus:outline-none tablet-desktop-view"
                    title="Просмотреть скриншот исходного сообщения"
                    aria-label="Просмотреть скриншот исходного сообщения"
                  >
                    <Hand className="h-6 w-6 text-gray-500 transition-transform duration-200 group-hover:scale-110 dark:text-gray-500" strokeWidth={1.5} />
                  </button>
                ) : (
                  <div
                    className="shrink-0 rounded tablet-desktop-view"
                    title="Создан вручную"
                    aria-label="Создан вручную"
                  >
                    <Hand className="h-6 w-6 text-gray-500 dark:text-gray-500" strokeWidth={1.5} />
                  </div>
                )}
                {/* Show MANUAL icon in iPad view */}
                {product.sourceScreenshotUrl ? (
                  <button
                    onClick={() => setIsSourceModalOpen(true)}
                    className="group shrink-0 cursor-pointer rounded focus:outline-none tablet-mobile-view"
                    title="Просмотреть скриншот исходного сообщения"
                    aria-label="Просмотреть скриншот исходного сообщения"
                  >
                    <Hand className="h-6 w-6 text-gray-500 transition-transform duration-200 group-hover:scale-110 dark:text-gray-500" strokeWidth={1.5} />
                  </button>
                ) : (
                  <div
                    className="shrink-0 rounded tablet-mobile-view"
                    title="Создан вручную"
                    aria-label="Создан вручную"
                  >
                    <Hand className="h-6 w-6 text-gray-500 dark:text-gray-500" strokeWidth={1.5} />
                  </div>
                )}
              </>
            )}
            {/* WhatsApp/AG source button */}
            {product.sourceMessageIds &&
              product.sourceMessageIds.length > 0 && (
                <button
                  onClick={() => setIsSourceModalOpen(true)}
                  className="group shrink-0 cursor-pointer rounded focus:outline-none"
                  title={`Просмотреть ${product.sourceMessageIds.length} источник${product.sourceMessageIds.length === 1 ? '' : product.sourceMessageIds.length < 5 ? 'а' : 'ов'}`}
                  aria-label="Просмотреть источник"
                >
                  {product.source === 'WA' || product.source === 'AG' ? (
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
          </>
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
        <SourceMessagesModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
          product={product}
        />
      )}

    </>
  );
}
