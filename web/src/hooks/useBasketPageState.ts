import { useState, useEffect, useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCart } from '@/contexts/CartContext';
import { popularTransportCompanies } from '@/lib/shipping';

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

export function useBasketPageState() {
  const { items, remove, updateQuantity, clear, setUserId } = useCart();
  const { addNotification } = useNotifications();

  const [products, setProducts] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ userId: string } | null>(null);
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(
    null
  );
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

  const selectedTransport = popularTransportCompanies.find(
    c => c.id === selectedTransportId
  );

  // Helper function to create fallback product
  const createFallbackProduct = useCallback(
    (slug: string) => ({
      id: '',
      slug,
      name: 'Товар не найден',
      article: null,
      pricePair: 0,
      images: [],
      category: { name: 'Неизвестно' },
    }),
    []
  );

  // Helper function to map items to products
  const mapItemsToProducts = useCallback(
    (items: Array<{ slug: string; quantity: number }>, products: Product[]) => {
      return items.map(item => {
        const product = products.find((p: Product) => p.slug === item.slug);
        return {
          ...item,
          product: product || createFallbackProduct(item.slug),
        };
      });
    },
    [createFallbackProduct]
  );

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (json.user) {
          setIsLoggedIn(true);
          setUser(json.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, []);

  // Load saved basket data (per user) on mount and when user changes
  useEffect(() => {
    try {
      const key = user?.userId
        ? `basket_user_data_${user.userId}`
        : 'basket_user_data_anonymous';
      const raw =
        typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (raw) {
        const data = JSON.parse(raw);
        if (data.transportId) {
          setSelectedTransportId(data.transportId);
        }
        if (data.userData) {
          setUserEmail(data.userData.email || '');
          setOrderPhone(data.userData.phone || '');
          setUserFullName(data.userData.fullName || '');
          setUserAddress(data.userData.address || '');
        }
      }
    } catch (error) {
      console.error('Failed to load basket data from localStorage', error);
    }
  }, [user?.userId]);

  // Save basket data to local storage whenever relevant state changes
  useEffect(() => {
    try {
      const key = user?.userId
        ? `basket_user_data_${user.userId}`
        : 'basket_user_data_anonymous';
      const dataToSave = {
        transportId: selectedTransportId,
        userData: {
          email: userEmail,
          phone: orderPhone,
          fullName: userFullName,
          address: userAddress,
        },
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error('Failed to save basket data:', error);
    }
  }, [
    selectedTransportId,
    userEmail,
    orderPhone,
    userFullName,
    userAddress,
    user?.userId,
  ]);

  // Load products for cart items
  useEffect(() => {
    const loadProducts = async () => {
      if (items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const slugs = items.map(item => item.slug);
        const response = await fetch(
          `/api/products/by-slugs?slugs=${slugs.join(',')}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        const productsWithData = mapItemsToProducts(items, data.products);
        setProducts(productsWithData);
      } catch (error) {
        console.error('Error loading products:', error);
        addNotification({
          type: 'error',
          title: 'Ошибка загрузки товаров',
          message: 'Не удалось загрузить информацию о товарах',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [items, addNotification, mapItemsToProducts]);

  return {
    // State
    products,
    loading,
    isLoginModalOpen,
    phone,
    otpCode,
    otpSent,
    loginLoading,
    loginError,
    isLoggedIn,
    user,
    selectedTransportId,
    isEditingTransport,
    isEditingUserData,
    userEmail,
    orderPhone,
    userFullName,
    userAddress,
    validationErrors,
    selectedTransport,

    // Actions
    setProducts,
    setIsLoginModalOpen,
    setPhone,
    setOtpCode,
    setOtpSent,
    setLoginLoading,
    setLoginError,
    setSelectedTransportId,
    setIsEditingTransport,
    setIsEditingUserData,
    setUserEmail,
    setOrderPhone,
    setUserFullName,
    setUserAddress,
    setValidationErrors,

    // Cart actions
    remove,
    updateQuantity,
    clear,
    setUserId,

    // Notifications
    addNotification,
  };
}
