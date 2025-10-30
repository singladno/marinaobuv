'use client';

interface CartItemWithProduct {
  slug: string;
  qty: number;
  color?: string | null;
  product: {
    id: string;
    pricePair: number;
  };
}

interface UseOrderHandlersProps {
  products: CartItemWithProduct[];
  selectedTransportId: string | null;
  selectedTransportOptions: Array<{ id: string; name: string }>;
  orderPhone: string;
  userFullName: string;
  userAddress: string;
  userEmail: string;
  orderComment: string;
  addNotification: (notification: any) => void;
  clear: () => void;
  clearTransportCompany: () => void;
  setIsCheckoutModalOpen: (open: boolean) => void;
  setValidationErrors: (
    updater:
      | { transport?: boolean; userData?: boolean }
      | ((prev: { transport?: boolean; userData?: boolean }) => {
          transport?: boolean;
          userData?: boolean;
        })
  ) => void;
  triggerScroll?: () => void;
}

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { formatOrderNumber } from '@/utils/orderNumberUtils';

export function useOrderHandlers({
  products,
  selectedTransportId,
  selectedTransportOptions,
  orderPhone,
  userFullName,
  userAddress,
  userEmail,
  orderComment,
  addNotification,
  clear,
  clearTransportCompany,
  setIsCheckoutModalOpen,
  setValidationErrors,
  triggerScroll,
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
    console.log('Place order clicked, checking validation...');
    console.log('Current values:', {
      selectedTransportId,
      userFullName,
      orderPhone,
      userAddress,
    });

    // Check transport company selection
    if (
      !selectedTransportId &&
      (!selectedTransportOptions || selectedTransportOptions.length === 0)
    ) {
      console.log('Transport validation failed');
      setValidationErrors(prev => ({ ...prev, transport: true }));
      triggerScroll?.();
      return;
    }

    // Check required user data fields
    const missingFields = [];
    if (!userFullName?.trim()) missingFields.push('name');
    if (!orderPhone?.trim()) missingFields.push('phone');
    if (!userAddress?.trim()) missingFields.push('address');

    console.log('Missing fields:', missingFields);

    if (missingFields.length > 0) {
      console.log('User data validation failed, setting errors');
      setValidationErrors(prev => ({ ...prev, userData: true }));
      triggerScroll?.();
      return;
    }

    try {
      setIsPlacingOrder(true);
      const orderItems = products.map(item => ({
        productId: item.product.id,
        qty: item.qty,
        priceBox: item.product.pricePair,
        color: item.color ?? null,
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
          transportOptions: selectedTransportOptions,
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
      clearTransportCompany();
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
