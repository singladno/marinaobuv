'use client';

interface CartItemWithProduct {
  slug: string;
  qty: number;
  product: {
    id: string;
    pricePair: number;
  };
}

interface UseOrderHandlersProps {
  products: CartItemWithProduct[];
  selectedTransportId: string | null;
  orderPhone: string;
  userFullName: string;
  userAddress: string;
  userEmail: string;
  orderComment: string;
  addNotification: (notification: any) => void;
  clear: () => void;
  setIsCheckoutModalOpen: (open: boolean) => void;
  setValidationErrors: (
    updater:
      | { transport?: boolean; userData?: boolean }
      | ((prev: { transport?: boolean; userData?: boolean }) => {
          transport?: boolean;
          userData?: boolean;
        })
  ) => void;
}

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { formatOrderNumber } from '@/utils/orderNumberUtils';

export function useOrderHandlers({
  products,
  selectedTransportId,
  orderPhone,
  userFullName,
  userAddress,
  userEmail,
  orderComment,
  addNotification,
  clear,
  setIsCheckoutModalOpen,
  setValidationErrors,
}: UseOrderHandlersProps) {
  const router = useRouter();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const calculateSubtotal = () => {
    return products.reduce(
      (sum, item) => sum + item.product.pricePair * item.qty,
      0
    );
  };

  const handlePlaceOrder = async () => {
    if (!selectedTransportId) {
      setValidationErrors(prev => ({ ...prev, transport: true }));
      return;
    }

    // Only phone should be required for placing an order
    if (!orderPhone) {
      setValidationErrors(prev => ({ ...prev, userData: true }));
      return;
    }

    try {
      setIsPlacingOrder(true);
      const orderItems = products.map(item => ({
        productId: item.product.id,
        qty: item.qty,
        priceBox: item.product.pricePair,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          fullName: userFullName,
          phone: orderPhone,
          email: userEmail,
          address: userAddress,
          comment: orderComment,
          transportCompanyId: selectedTransportId,
          total: calculateSubtotal(),
          subtotal: calculateSubtotal(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const result = await response.json();
      addNotification({
        type: 'success',
        title: 'Заказ оформлен!',
        message: `Ваш заказ #${formatOrderNumber(result.order.orderNumber)} успешно оформлен.`,
      });
      clear();
      setIsCheckoutModalOpen(false);
      router.push('/orders');
    } catch (error: unknown) {
      const err = error as Error;
      addNotification({
        type: 'error',
        title: 'Ошибка оформления заказа',
        message: err.message,
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return {
    calculateSubtotal,
    handlePlaceOrder,
    isPlacingOrder,
  };
}
