'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import TransportCompanySelector from '@/components/features/TransportCompanySelector';
import { popularTransportCompanies } from '@/lib/shipping';
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
  const { items, add, remove, updateQuantity, clear } = useCart();
  const [products, setProducts] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(
    null
  );
  const [isEditingTransport, setIsEditingTransport] = useState(false);
  const selectedTransport = popularTransportCompanies.find(
    c => c.id === selectedTransportId
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
    // For now, just simulate login - in real implementation, this would send SMS
    setIsLoggedIn(true);
    setUser({ phone, name: 'User' });
    setIsLoginModalOpen(false);
  };

  const handleUpdateQuantity = (slug: string, newQty: number) => {
    updateQuantity(slug, newQty);
  };

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = products.reduce(
    (sum, item) => sum + item.product.pricePair * item.qty,
    0
  );
  const discount = Math.floor(subtotal * 0.21); // 21% discount
  const total = subtotal - discount;

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
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-lg font-semibold text-purple-600">
                          {item.product.pricePair * item.qty} ₽
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {Math.floor(item.product.pricePair * item.qty * 1.28)}{' '}
                          ₽
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
            <div className="rounded-lg bg-white p-6">
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
            <div className="rounded-lg bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Мои данные
                </h2>
                {isLoggedIn && (
                  <button
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
                )}
              </div>

              {isLoggedIn ? (
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
                  </div>
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
                  <span>Товары, {totalItems} шт.</span>
                  <span>{subtotal} ₽</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Моя скидка</span>
                  <span>-{discount} ₽</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Скидка при оплате</span>
                  <span>-{Math.floor(discount * 0.05)} ₽</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Итого</span>
                  <span className="text-purple-600">{total} ₽</span>
                </div>
              </div>

              <Button className="mt-6 w-full bg-purple-600 text-white hover:bg-purple-700">
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

            <Button
              type="submit"
              className="w-full bg-purple-600 text-white hover:bg-purple-700"
            >
              Войти
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
