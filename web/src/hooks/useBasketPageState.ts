import { useState, useEffect, useRef } from 'react';
import { isValidPhoneNumber } from '@/utils/phoneMask';
import { useBasketAuth } from './useBasketAuth';
import { useCart } from '@/contexts/CartContext';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useOptimizedBasketCart } from './useOptimizedBasketCart';
import { useBasketOrder } from './useBasketOrder';
import { popularTransportCompanies, TransportCompany } from '@/lib/shipping';
import { TransportOption } from '@/components/features/TransportOptionSelector';
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
  const [selectedTransportOptions, setSelectedTransportOptions] = useState<
    TransportOption[]
  >([]);
  const selectedTransport: TransportCompany | null =
    customTransportCompany || order.selectedShipping || null;

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
  const [scrollTrigger, setScrollTrigger] = useState(0);

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
        selectedTransportOptions?: TransportOption[];
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
      if (typeof saved.userEmail === 'string' && saved.userEmail.trim())
        setUserEmail(saved.userEmail);
      if (typeof saved.userFullName === 'string' && saved.userFullName.trim())
        setUserFullName(saved.userFullName);
      if (typeof saved.userAddress === 'string')
        setUserAddress(saved.userAddress);
      if (typeof saved.orderComment === 'string')
        setOrderComment(saved.orderComment);
      // Restore transport options selection
      if (
        Array.isArray(saved.selectedTransportOptions) &&
        saved.selectedTransportOptions.length > 0
      ) {
        setSelectedTransportOptions(saved.selectedTransportOptions);
      }
      // Restore transport company selection (legacy support)
      if (saved.customTransportCompany) {
        // Custom transport company takes priority
        setCustomTransportCompany(saved.customTransportCompany);
        setSelectedTransportId('other');
        order.setSelectedShipping(saved.customTransportCompany);
      } else if (saved.selectedTransportId) {
        // Regular transport company
        setSelectedTransportId(saved.selectedTransportId);
        const company = popularTransportCompanies.find(
          c => c.id === saved.selectedTransportId
        );
        if (company) {
          order.setSelectedShipping(company);
        }
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

  // Prefill email from authenticated user once (avoid refilling after user clears)
  const hasAutofilledEmailRef = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasAutofilledEmailRef.current) return;
    // Prefill if user has email and current email is empty
    if (user?.email && !userEmail?.trim()) {
      setUserEmail(user.email);
      hasAutofilledEmailRef.current = true;
    }
    // Only depends on user email; do not re-run on userEmail changes
  }, [user?.email]);

  // Prefill name from authenticated user once (avoid refilling after user clears)
  const hasAutofilledNameRef = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasAutofilledNameRef.current) return;
    // Prefill if user has name and current name is empty
    if (user?.name && !userFullName?.trim()) {
      setUserFullName(user.name);
      hasAutofilledNameRef.current = true;
    }
    // Only depends on user name; do not re-run on userFullName changes
  }, [user?.name]);

  // Additional prefilling after localStorage restoration
  useEffect(() => {
    // Only run if user is loaded and we haven't autofilled yet
    if (!user) return;

    // Prefill email if empty and user has email
    if (user.email && !userEmail?.trim() && !hasAutofilledEmailRef.current) {
      setUserEmail(user.email);
      hasAutofilledEmailRef.current = true;
    }

    // Prefill name if empty and user has name
    if (user.name && !userFullName?.trim() && !hasAutofilledNameRef.current) {
      setUserFullName(user.name);
      hasAutofilledNameRef.current = true;
    }
  }, [user, userEmail, userFullName]);

  // Debug: Log user data and prefilling status
  useEffect(() => {
    console.log('User data:', {
      email: user?.email,
      name: user?.name,
      currentEmail: userEmail,
      currentName: userFullName,
      hasAutofilledEmail: hasAutofilledEmailRef.current,
      hasAutofilledName: hasAutofilledNameRef.current,
    });
  }, [user?.email, user?.name, userEmail, userFullName]);

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
        selectedTransportOptions,
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
    selectedTransportOptions,
    userId,
  ]);

  // Clear validation errors when user fixes issues
  useEffect(() => {
    if (Boolean(userId) && validationErrors.userData) {
      // Only clear if all required fields are actually filled
      if (userFullName?.trim() && orderPhone?.trim() && userAddress?.trim()) {
        setValidationErrors(prev => ({ ...prev, userData: false }));
      }
    }
  }, [
    userId,
    validationErrors.userData,
    userFullName,
    orderPhone,
    userAddress,
  ]);

  useEffect(() => {
    if (
      (selectedTransportOptions.length > 0 || selectedTransportId) &&
      validationErrors.transport
    ) {
      setValidationErrors(prev => ({ ...prev, transport: false }));
    }
  }, [
    selectedTransportId,
    selectedTransportOptions,
    validationErrors.transport,
  ]);

  // Clear userData validation error when all required fields are filled
  useEffect(() => {
    if (
      validationErrors.userData &&
      userFullName?.trim() &&
      orderPhone?.trim() &&
      userAddress?.trim()
    ) {
      setValidationErrors(prev => ({ ...prev, userData: false }));
    }
  }, [userFullName, orderPhone, userAddress, validationErrors.userData]);

  // Keep order.selectedShipping in sync with selectedTransportId and customTransportCompany
  useEffect(() => {
    if (!selectedTransportId) return;

    // Handle custom companies (id === 'other')
    if (selectedTransportId === 'other') {
      // For custom companies, ensure the order state is updated
      if (customTransportCompany) {
        order.setSelectedShipping(customTransportCompany);
      }
      return;
    }

    // Handle regular companies
    const company = popularTransportCompanies.find(
      c => c.id === selectedTransportId
    );
    if (company) {
      order.setSelectedShipping(company);
    }
  }, [selectedTransportId, customTransportCompany, order]);

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

  // Function to trigger scrolling to validation errors
  const triggerScroll = () => {
    setScrollTrigger(prev => prev + 1);
  };

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
    selectedTransportOptions,
    setSelectedTransportOptions,
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
    scrollTrigger,
    triggerScroll,
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
