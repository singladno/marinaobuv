import { useState } from 'react';
import { useBasketAuth } from './useBasketAuth';
import { useCart } from '@/contexts/CartContext';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useBasketCart } from './useBasketCart';
import { useBasketOrder } from './useBasketOrder';

export function useBasketPageState() {
  const cart = useBasketCart();
  const auth = useBasketAuth();
  const order = useBasketOrder();
  const { userId, setUserId, clear } = useCart();
  const { addNotification } = useNotifications();

  const finalTotal = cart.totalPrice + order.shippingCost;
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(
    null
  );
  const selectedTransport = order.selectedShipping
    ? {
        id: order.selectedShipping.id,
        name: order.selectedShipping.name,
        cost: order.selectedShipping.priceLabel === 'Бесплатно' ? 0 : 250,
      }
    : null;
  const [isEditingTransport, setIsEditingTransport] = useState(false);
  const [isEditingUserData, setIsEditingUserData] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userAddress, setUserAddress] = useState('');

  // Shim auth states expected by page/handlers
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  return {
    ...cart,
    ...auth,
    ...order,
    finalTotal,
    // aliases expected by BasketPage/LoginModal
    otpCode: auth.otp,
    setOtpCode: auth.setOtp,
    // aliases expected by BasketPage
    remove: cart.handleRemoveItem,
    updateQuantity: cart.handleUpdateQuantity,
    addNotification,
    setUserId,
    clear,
    selectedTransport,
    isEditingTransport,
    setIsEditingTransport,
    selectedTransportId,
    setSelectedTransportId,
    isEditingUserData,
    setIsEditingUserData,
    userEmail,
    setUserEmail,
    orderPhone,
    setOrderPhone,
    userFullName,
    setUserFullName,
    userAddress,
    setUserAddress,
    // compatibility fields expected by basket page and handlers
    isLoggedIn: Boolean(userId),
    loginLoading,
    setLoginLoading,
    loginError,
    setLoginError,
    otpSent,
    setOtpSent,
  };
}
