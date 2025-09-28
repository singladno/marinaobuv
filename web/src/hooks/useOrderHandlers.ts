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
  addNotification: (notification: any) => void;
  clear: () => void;
  setIsCheckoutModalOpen: (open: boolean) => void;
}

export function useOrderHandlers({
  products,
  selectedTransportId,
  orderPhone,
  userFullName,
  userAddress,
  userEmail,
  addNotification,
  clear,
  setIsCheckoutModalOpen,
}: UseOrderHandlersProps) {
  const calculateSubtotal = () => {
    return products.reduce(
      (sum, item) => sum + item.product.pricePair * item.qty,
      0
    );
  };

  const handlePlaceOrder = async () => {
    if (!selectedTransportId) {
      addNotification({
        type: 'error',
        title: 'Ошибка оформления заказа',
        message: 'Пожалуйста, выберите транспортную компанию.',
      });
      return;
    }

    if (!orderPhone || !userFullName || !userAddress) {
      addNotification({
        type: 'error',
        title: 'Ошибка оформления заказа',
        message: 'Пожалуйста, заполните все обязательные поля для доставки.',
      });
      return;
    }

    try {
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
        message: `Ваш заказ #${result.order.orderNumber} успешно оформлен.`,
      });
      clear();
      setIsCheckoutModalOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      addNotification({
        type: 'error',
        title: 'Ошибка оформления заказа',
        message: err.message,
      });
    }
  };

  return {
    calculateSubtotal,
    handlePlaceOrder,
  };
}
