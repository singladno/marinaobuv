'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import TransportCompanySelector from '@/components/features/TransportCompanySelector';
import { popularTransportCompanies } from '@/lib/shipping';
import { useNotifications } from '@/components/ui/NotificationProvider';
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  HeartIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  pricePair: number;
  priceBox: number | null;
  packPairs?: number | null;
  images: Array<{ url: string; alt?: string }>;
  category: {
    name: string;
  };
}

interface CartItemWithProduct {
  slug: string;
  qty: number;
  product: Product;
}

export default function BasketPage() {
  const { items, add, remove, updateQuantity, clear, setUserId } = useCart();
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
  const [user, setUser] = useState<any>(null);
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

  // Local persistence helpers
  const getUserDataStorageKey = (uid: string | null | undefined) =>
    uid ? `basket_user_data_${uid}` : 'basket_user_data_anonymous';

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
      const key = getUserDataStorageKey(user?.userId);
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
  }, [user?.userId]);

  // Persist basket data to localStorage when any field changes
  useEffect(() => {
    try {
      const key = getUserDataStorageKey(user?.userId);
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
    user?.userId,
  ]);

  // Clear validation errors when user fixes issues
  useEffect(() => {
    if (isLoggedIn && validationErrors.userData) {
      setValidationErrors(prev => ({ ...prev, userData: false }));
    }
  }, [isLoggedIn, validationErrors.userData]);

  useEffect(() => {
    if (selectedTransportId && validationErrors.transport) {
      setValidationErrors(prev => ({ ...prev, transport: false }));
    }
  }, [selectedTransportId, validationErrors.transport]);

  // Fetch product details for cart items
  useEffect(() => {
    const fetchProducts = async () => {
      if (items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const productPromises = items.map(async item => {
          if (!item.slug) return null;
          try {
            const res = await fetch(
              `/api/products/by-slug/${encodeURIComponent(item.slug)}`
            );
            if (!res.ok) return null;
            const data = await res.json();
            if (!data?.product) return null;
            return {
              ...item,
              product: data.product,
            } as CartItemWithProduct;
          } catch {
            return null;
          }
        });

        const productsWithData = (await Promise.all(productPromises)).filter(
          (p): p is CartItemWithProduct => p !== null
        );
        setProducts(productsWithData);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [items]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      if (!otpSent) {
        const res = await fetch('/api/auth/request-otp', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || 'Не удалось отправить код');
        }
        setOtpSent(true);
        return;
      }
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Неверный код');
      }
      const data = await res.json();
      setIsLoggedIn(true);
      setUser({
        userId: data.user.id,
        phone: data.user.phone,
        name: data.user.name,
        role: data.user.role,
      });
      setUserId(data.user.id);
      setIsLoginModalOpen(false);
      setOtpCode('');
      setOtpSent(false);
    } catch (err: any) {
      setLoginError(err?.message || 'Ошибка входа');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUpdateQuantity = (slug: string, newQty: number) => {
    updateQuantity(slug, newQty);
  };

  const handleOrderClick = () => {
    const errors: { transport?: boolean; userData?: boolean } = {};

    // Check if user is logged in
    if (!isLoggedIn) {
      errors.userData = true;
    }

    // Check if transport is selected
    if (!selectedTransportId) {
      errors.transport = true;
    }

    setValidationErrors(errors);

    // If no errors, proceed with order
    if (Object.keys(errors).length === 0) {
      const payload = {
        items: items.map(i => ({ slug: i.slug, qty: i.qty })),
        phone: (orderPhone || user?.phone || '').trim(),
        email: userEmail || undefined,
        fullName: userFullName || undefined,
        address: userAddress || undefined,
        transportId: selectedTransportId,
        transportName: selectedTransport?.name || undefined,
      };

      fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async res => {
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error || 'Ошибка оформления заказа');
          }
          return res.json();
        })
        .then(data => {
          // Clear cart and keep user data persisted
          clear();
          setIsEditingUserData(false);
          addNotification({
            type: 'success',
            title: 'Заказ создан',
            message: `Номер заказа: ${data.orderNumber}`,
          });
        })
        .catch(err => {
          addNotification({
            type: 'error',
            title: 'Ошибка оформления заказа',
            message: err?.message || 'Попробуйте ещё раз',
          });
        });
    }
  };

  const getBoxPrice = (p: Product): number => {
    if (p.priceBox != null) return Number(p.priceBox);
    // Only use box price, no fallback to pair price
    return 0;
  };

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = products.reduce(
    (sum, item) => sum + getBoxPrice(item.product) * item.qty,
    0
  );
  const total = subtotal;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Загрузка корзины...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              Корзина пуста
            </h1>
            <p className="mb-6 text-gray-600">
              Добавьте товары в корзину, чтобы оформить заказ
            </p>
            <Link href="/catalog">
              <Button>Перейти в каталог</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Корзина Section */}
            <div className="rounded-lg bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Корзина</h2>
                <span className="text-sm text-gray-600">
                  {totalItems} товар
                </span>
              </div>

              <div className="space-y-4">
                {products.map(item => (
                  <div
                    key={item.slug}
                    className="flex gap-4 rounded-lg border border-gray-200 p-4"
                  >
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100"
                      aria-label={`${item.product.name}`}
                    >
                      <Image
                        src={
                          item.product.images[0]?.url || '/images/demo/1.jpg'
                        }
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex-1">
                      <h3 className="mb-1 font-medium text-gray-900">
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="hover:underline"
                        >
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className="mb-2 text-sm text-gray-600">
                        {item.product.article &&
                          `Артикул: ${item.product.article}`}
                      </p>
                      <p className="text-sm text-gray-500">Послезавтра</p>
                      <p className="text-sm text-gray-500">
                        Бесплатный отказ при получении
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.slug, item.qty - 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                          aria-label="Уменьшить количество"
                          title="Уменьшить количество"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.qty}</span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.slug, item.qty + 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                          aria-label="Увеличить количество"
                          title="Увеличить количество"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="mb-2 flex flex-col items-end gap-1">
                        <span className="text-lg font-semibold text-purple-600">
                          {getBoxPrice(item.product) * item.qty} ₽
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600"
                          aria-label="Скачать"
                          title="Скачать"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-500"
                          aria-label="Добавить в избранное"
                          title="Добавить в избранное"
                        >
                          <HeartIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(item.slug)}
                          className="p-2 text-gray-400 hover:text-red-500"
                          aria-label="Удалить из корзины"
                          title="Удалить из корзины"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ТК Selection Section */}
            <div
              className={`rounded-lg bg-white p-6 ${validationErrors.transport ? 'border-2 border-purple-500' : ''}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Выбор транспортной компании
                </h2>
                <button
                  className="text-purple-600 hover:text-purple-700"
                  aria-label="Редактировать выбор ТК"
                  title="Редактировать выбор ТК"
                  onClick={() => setIsEditingTransport(prev => !prev)}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
              {isEditingTransport ? (
                <TransportCompanySelector
                  value={selectedTransportId || undefined}
                  onChange={id => {
                    setSelectedTransportId(id);
                    setIsEditingTransport(false);
                  }}
                />
              ) : selectedTransport ? (
                <button
                  type="button"
                  onClick={() => setIsEditingTransport(true)}
                  className="w-full rounded-lg border border-gray-200 p-4 text-left hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{selectedTransport.name}</h3>
                      {selectedTransport.address && (
                        <p className="text-sm text-gray-600">
                          {selectedTransport.address}
                        </p>
                      )}
                      {selectedTransport.workingHours && (
                        <p className="text-sm text-gray-500">
                          {selectedTransport.workingHours}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        {selectedTransport.priceLabel}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedTransport.eta}
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <p className="mb-3 text-gray-600">
                    Транспортная компания не выбрана
                  </p>
                  <Button onClick={() => setIsEditingTransport(true)}>
                    Выбрать компанию
                  </Button>
                </div>
              )}
            </div>

            {/* Мои данные Section */}
            <div
              className={`rounded-lg bg-white p-6 ${validationErrors.userData ? 'border-2 border-purple-500' : ''}`}
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Мои данные
                </h2>
              </div>

              {isLoggedIn ? (
                <div
                  className={`rounded-lg p-4 ${validationErrors.userData ? 'border-2 border-purple-500' : 'border border-gray-200'}`}
                >
                  {!isEditingUserData ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                          <svg
                            className="h-5 w-5 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user?.name || 'Пользователь'}
                          </p>
                          <p className="text-sm text-gray-600">{user?.phone}</p>
                          {userFullName && (
                            <p className="text-sm text-gray-600">
                              {userFullName}
                            </p>
                          )}
                          {userEmail && (
                            <p className="text-sm text-gray-600">{userEmail}</p>
                          )}
                          {userAddress && (
                            <p className="text-sm text-gray-600">
                              {userAddress}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingUserData(true)}
                        className="text-purple-600 hover:text-purple-700"
                        aria-label="Редактировать данные"
                        title="Редактировать данные"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          ФИО (необязательно)
                        </label>
                        <input
                          type="text"
                          value={userFullName}
                          onChange={e => setUserFullName(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Иванов Иван Иванович"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Телефон для заказа
                        </label>
                        <input
                          type="tel"
                          value={orderPhone || user?.phone}
                          onChange={e => setOrderPhone(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="+7 (999) 123-45-67"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Email (необязательно)
                        </label>
                        <input
                          type="email"
                          value={userEmail}
                          onChange={e => setUserEmail(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="example@email.com"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Адрес (необязательно)
                        </label>
                        <input
                          type="text"
                          value={userAddress}
                          onChange={e => setUserAddress(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Город, улица, дом, офис"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditingUserData(false)}
                          className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingUserData(false);
                            setUserEmail('');
                            setOrderPhone('');
                            setUserFullName('');
                            setUserAddress('');
                          }}
                          className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-gray-600">
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="font-medium text-purple-600 hover:text-purple-700"
                    >
                      Войти или зарегистрироваться
                    </button>
                    , чтобы оформить заказ
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Delivery Summary */}
            <div className="rounded-lg bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Доставка{' '}
                  {selectedTransport ? selectedTransport.name : '— не выбрана'}
                </h2>
                <button
                  className="text-purple-600 hover:text-purple-700"
                  aria-label="Редактировать доставку"
                  title="Редактировать доставку"
                  onClick={() => setIsEditingTransport(true)}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
              {selectedTransport ? (
                <>
                  {selectedTransport.address && (
                    <p className="text-sm text-gray-600">
                      {selectedTransport.address}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    {selectedTransport.eta}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Выберите транспортную компанию
                </p>
              )}
            </div>

            {/* Order Total */}
            <div className="rounded-lg bg-white p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Товары, {totalItems} кор.</span>
                  <span>{subtotal} ₽</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Итого</span>
                  <span className="text-purple-600">{total} ₽</span>
                </div>
              </div>

              <Button
                onClick={handleOrderClick}
                className="mt-6 w-full bg-purple-600 text-white hover:bg-purple-700"
              >
                Заказать
              </Button>

              <div className="mt-4 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  defaultChecked
                  aria-label="Согласие с правилами"
                  title="Согласие с правилами"
                />
                <p className="text-xs text-gray-600">
                  Соглашаюсь с правилами пользования торговой площадкой и
                  возврата
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Войти под номером"
        size="sm"
      >
        <div className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Номер телефона
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <Input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+7 996 366-36-60"
                  className="pl-10"
                  required
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Код из SMS
                </label>
                <Input
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>
            )}

            {loginError && (
              <div className="rounded bg-red-50 p-2 text-sm text-red-700">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-purple-600 text-white hover:bg-purple-700"
            >
              {loginLoading
                ? otpSent
                  ? 'Проверяем…'
                  : 'Отправляем…'
                : otpSent
                  ? 'Войти'
                  : 'Отправить код'}
            </Button>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                defaultChecked
                aria-label="Согласие с правилами"
                title="Согласие с правилами"
              />
              <p className="text-xs text-gray-600">
                Соглашаюсь с правилами пользования торговой площадкой и возврата
              </p>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
