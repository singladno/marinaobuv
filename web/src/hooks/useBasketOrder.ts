import { useState, useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCart } from '@/contexts/CartContext';
import {
  popularTransportCompanies,
  type TransportCompany,
} from '@/lib/shipping';

export function useBasketOrder() {
  const { clear } = useCart();
  const { addNotification } = useNotifications();

  const [selectedShipping, setSelectedShipping] =
    useState<TransportCompany | null>(null);

  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');

  const shippingCost = selectedShipping?.priceLabel === 'Бесплатно' ? 0 : 250; // Default cost for paid shipping

  const handlePlaceOrder = useCallback(async () => {
    if (!shippingAddress.trim()) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Укажите адрес доставки',
      });
      return;
    }

    try {
      // Simulate order placement
      await new Promise(resolve => setTimeout(resolve, 2000));
      clear();
      addNotification({
        type: 'success',
        title: 'Заказ оформлен',
        message: 'Ваш заказ успешно оформлен',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось оформить заказ',
      });
    }
  }, [shippingAddress, clear, addNotification]);

  return {
    selectedShipping,
    setSelectedShipping,
    shippingAddress,
    setShippingAddress,
    notes,
    setNotes,
    shippingCost,
    handlePlaceOrder,
  };
}
