import { useState, useEffect, useRef } from 'react';
import { isValidPhoneNumber } from '@/utils/phoneMask';
import { useBasketAuth } from './useBasketAuth';
import { useCart } from '@/contexts/CartContext';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useOptimizedBasketCart } from './useOptimizedBasketCart';
import { useBasketOrder } from './useBasketOrder';
import { popularTransportCompanies, TransportCompany } from '@/lib/shipping';
import { useUser } from '@/contexts/NextAuthUserContext';

export function useBasketPageState() {
  const cart = useOptimizedBasketCart();
  const auth = useBasketAuth();
  const order = useBasketOrder();
  const { userId, setUserId, clear } = useCart();
  const { addNotification } = useNotifications();
  const { user } = useUser();

  const finalTotal = cart.totalPrice + order.shippingCost;
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(
    null
  );
  const [customTransportCompany, setCustomTransportCompany] =
    useState<TransportCompany | null>(null);
  const selectedTransport: TransportCompany | null =
    order.selectedShipping || null;

  const [isEditingTransport, setIsEditingTransport] = useState(false);
  const [isEditingUserData, setIsEditingUserData] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [orderComment, setOrderComment] = useState('');
  const [isEditingComment, setIsEditingComment] = useState(false);
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

      // One-time clearing of old transport data - remove this after deployment
      if (typeof window !== 'undefined') {
        const clearOldTransportData = window.localStorage.getItem(
          'clearOldTransportData'
        );
        if (!clearOldTransportData) {
          window.localStorage.removeItem(key);
          window.localStorage.setItem('clearOldTransportData', 'true');
          return; // Don't restore any data on this load
        }
      }

      const raw =
        typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        orderPhone?: string;
        userEmail?: string;
        userFullName?: string;
        userAddress?: string;
        orderComment?: string;
        selectedTransportId?: string | null;
        customTransportCompany?: TransportCompany;
        version?: number;
      };

      // Clear transport data from old versions to prevent stale data issues
      const currentVersion = 1;
      if (!saved.version || saved.version < currentVersion) {
        saved.selectedTransportId = null;
        saved.customTransportCompany = undefined;
        // Also clear the localStorage entry to prevent future issues
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return; // Don't restore any data from old versions
      }
      // Only restore a previously saved phone if it looks valid
      if (
        typeof saved.orderPhone === 'string' &&
        saved.orderPhone.trim() !== '' &&
        isValidPhoneNumber(saved.orderPhone)
      ) {
        setOrderPhone(saved.orderPhone);
      }
      if (typeof saved.userEmail === 'string') setUserEmail(saved.userEmail);
      if (typeof saved.userFullName === 'string')
        setUserFullName(saved.userFullName);
      if (typeof saved.userAddress === 'string')
        setUserAddress(saved.userAddress);
      if (typeof saved.orderComment === 'string')
        setOrderComment(saved.orderComment);
      if (saved.selectedTransportId) {
        setSelectedTransportId(saved.selectedTransportId);
        // Find the company and set it in order state
        const company = popularTransportCompanies.find(
          c => c.id === saved.selectedTransportId
        );
        if (company) {
          order.setSelectedShipping(company);
        }
      }
      if (saved.customTransportCompany) {
        setCustomTransportCompany(saved.customTransportCompany);
        order.setSelectedShipping(saved.customTransportCompany);
        // Ensure selectedTransportId is set for custom companies
        setSelectedTransportId('other');
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Prefill phone from authenticated user once (avoid refilling after user clears)
  const hasAutofilledPhoneRef = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasAutofilledPhoneRef.current) return;
    // Prefill if user has phone and current phone is empty or invalid
    if (user?.phone && (!orderPhone || !isValidPhoneNumber(orderPhone))) {
      setOrderPhone(user.phone);
      hasAutofilledPhoneRef.current = true;
    }
    // Only depends on user phone; do not re-run on orderPhone changes
  }, [user?.phone]);

  // Persist basket data to localStorage when any field changes
  useEffect(() => {
    try {
      const key = getUserDataStorageKey(userId);
      const toSave = {
        orderPhone,
        userEmail,
        userFullName,
        userAddress,
        orderComment,
        selectedTransportId,
        customTransportCompany,
        timestamp: Date.now(),
        version: 1,
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
    orderComment,
    selectedTransportId,
    customTransportCompany,
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

  // Keep order.selectedShipping in sync with selectedTransportId
  useEffect(() => {
    if (!selectedTransportId) return;

    // Handle custom companies (id === 'other')
    if (selectedTransportId === 'other') {
      // For custom companies, we don't need to do anything here
      // as the company is already set via setSelectedTransportCompany
      return;
    }

    // Handle regular companies
    const company = popularTransportCompanies.find(
      c => c.id === selectedTransportId
    );
    if (company) {
      order.setSelectedShipping(company);
    }
  }, [selectedTransportId, order]);

  // Custom setSelectedTransportCompany function that also updates customTransportCompany state
  const handleSetSelectedTransportCompany = (company: TransportCompany) => {
    order.setSelectedShipping(company);
    if (company.id === 'other') {
      setCustomTransportCompany(company);
    } else {
      setCustomTransportCompany(null);
    }
  };

  // Function to clear transport company selection
  const clearTransportCompany = () => {
    setSelectedTransportId(null);
    setCustomTransportCompany(null);
    order.setSelectedShipping(null);
  };

  // Shim auth states expected by page/handlers
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  return {
    ...cart,
    ...auth,
    ...order,
    finalTotal,
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
    setSelectedTransportCompany: handleSetSelectedTransportCompany,
    clearTransportCompany,
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
    orderComment,
    setOrderComment,
    isEditingComment,
    setIsEditingComment,
    validationErrors,
    setValidationErrors,
    // compatibility fields expected by basket page and handlers
    isLoggedIn: Boolean(userId),
    loginLoading,
    setLoginLoading,
    loginError,
    setLoginError,
    // updating items state
    updatingItems: cart.updatingItems,
    removingItems: cart.removingItems,
    // favorites state
    favorites: cart.favorites,
    handleToggleFavorite: cart.handleToggleFavorite,
  };
}
