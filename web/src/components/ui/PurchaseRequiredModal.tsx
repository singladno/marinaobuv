'use client';

import { ShoppingBag, X } from 'lucide-react';

import { Button } from './Button';

interface PurchaseRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseRequiredModal({
  isOpen,
  onClose,
}: PurchaseRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid min-h-screen place-content-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Content */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800 dark:ring-white/10">
          <div className="px-8 py-10">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <ShoppingBag className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>

            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Требуется покупка
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Вы можете оставить отзыв только после покупки этого товара
              </p>
            </div>

            {/* Content */}
            <div className="mb-8 space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Почему это важно?</strong>
                  <br />
                  Отзывы от реальных покупателей помогают другим клиентам
                  принять правильное решение о покупке.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Понятно
              </Button>
              <Button
                onClick={() => {
                  // Scroll to product details or add to cart
                  const addToCartButton =
                    document.querySelector('[data-add-to-cart]');
                  if (addToCartButton) {
                    addToCartButton.scrollIntoView({ behavior: 'smooth' });
                  }
                  onClose();
                }}
                className="flex-1"
              >
                Перейти к покупке
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
