import { useState, useEffect } from 'react';
import { useBasketAuth } from './useBasketAuth';
import { useCart } from '@/contexts/CartContext';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useBasketCart } from './useBasketCart';
import { useBasketOrder } from './useBasketOrder';
import { popularTransportCompanies, TransportCompany } from '@/lib/shipping';

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
  const selectedTransport: TransportCompany | null =
    order.selectedShipping || null;
  const [isEditingTransport, setIsEditingTransport] = useState(false);
  const [isEditingUserData, setIsEditingUserData] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    transport?: boolean;
    userData?: boolean;
  }>({});

  // Local persistence helpers
  const getUserDataStorageKey = (uid: string | null | undefined) =>
    uid ? `basket_user_data_${uid}` : 'basket_user_data_anonymous';

  // Load saved basket data (per user) on mount and when user changes
  useEffect(() => {
    try {
      const key = getUserDataStorageKey(userId);
      const raw =
        typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        orderPhone?: string;
        userEmail?: string;
        userFullName?: string;
        userAddress?: string;
        selectedTransportId?: string | null;
      };
      if (typeof saved.orderPhone === 'string') setOrderPhone(saved.orderPhone);
      if (typeof saved.userEmail === 'string') setUserEmail(saved.userEmail);
      if (typeof saved.userFullName === 'string')
        setUserFullName(saved.userFullName);
      if (typeof saved.userAddress === 'string')
        setUserAddress(saved.userAddress);
      if (saved.selectedTransportId)
        setSelectedTransportId(saved.selectedTransportId);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Persist basket data to localStorage when any field changes
  useEffect(() => {
    try {
      const key = getUserDataStorageKey(userId);
      const toSave = {
        orderPhone,
        userEmail,
        userFullName,
        userAddress,
        selectedTransportId,
        timestamp: Date.now(),
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(toSave));
      }
    } catch {}
  }, [
    orderPhone,
    userEmail,
    userFullName,
    userAddress,
    selectedTransportId,
    userId,
  ]);

  // Clear validation errors when user fixes issues
  useEffect(() => {
    if (Boolean(userId) && validationErrors.userData) {
      setValidationErrors(prev => ({ ...prev, userData: false }));
    }
  }, [userId, validationErrors.userData]);

  useEffect(() => {
    if (selectedTransportId && validationErrors.transport) {
      setValidationErrors(prev => ({ ...prev, transport: false }));
    }
  }, [selectedTransportId, validationErrors.transport]);

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
    validationErrors,
    setValidationErrors,
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
