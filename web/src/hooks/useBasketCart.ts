import { useState, useEffect, useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  slug: string;
  name: string;
  pricePair: number;
  images: Array<{ url: string; alt?: string }>;
  category: { name: string };
  article?: string;
}

interface CartItemWithProduct {
  slug: string;
  qty: number;
  product: Product;
}

export function useBasketCart() {
  const { items, remove, updateQuantity, clear } = useCart();
  const { addNotification } = useNotifications();

  const [products, setProducts] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const totalPrice = products.reduce(
    (sum, item) => sum + item.product.pricePair * item.qty,
    0
  );

  const handleRemoveItem = useCallback(
    (slug: string) => {
      remove(slug);
      addNotification({
        type: 'success',
        title: 'Товар удален',
        message: 'Товар удален из корзины',
      });
    },
    [remove, addNotification]
  );

  const handleUpdateQuantity = useCallback(
    (slug: string, qty: number) => {
      if (qty <= 0) {
        handleRemoveItem(slug);
        return;
      }
      updateQuantity(slug, qty);
    },
    [updateQuantity, handleRemoveItem]
  );

  const handleClearCart = useCallback(() => {
    clear();
    addNotification({
      type: 'success',
      title: 'Корзина очищена',
      message: 'Все товары удалены из корзины',
    });
  }, [clear, addNotification]);

  useEffect(() => {
    setProducts(items);
    setLoading(false);
  }, [items]);

  return {
    products,
    loading,
    totalPrice,
    handleRemoveItem,
    handleUpdateQuantity,
    handleClearCart,
  };
}
