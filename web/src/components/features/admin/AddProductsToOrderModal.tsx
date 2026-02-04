'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Search, Plus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { TableLoader } from '@/components/ui/Loader';
import { useNotifications } from '@/components/ui/NotificationProvider';

interface Product {
  id: string;
  name: string;
  slug: string;
  article: string | null;
  pricePair: number;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    color: string | null;
  }>;
  category: {
    id: string;
    name: string;
  } | null;
}

interface AddProductsToOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onProductAdded: () => void;
}

export function AddProductsToOrderModal({
  isOpen,
  onClose,
  orderId,
  onProductAdded,
}: AddProductsToOrderModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    pageSize: 20,
  });
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, { product: Product; qty: number; color: string | null }>
  >(new Map());
  const [addingProducts, setAddingProducts] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const { addNotification } = useNotifications();

  const fetchProducts = useCallback(
    async (search: string, pageNum: number) => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        if (search) {
          searchParams.set('search', search);
        }
        searchParams.set('page', pageNum.toString());
        searchParams.set('pageSize', '20');

        const response = await fetch(`/api/admin/products?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        if (pageNum === 1) {
          setProducts(data.products || []);
        } else {
          setProducts(prev => [...prev, ...(data.products || [])]);
        }
        setPagination(data.pagination || { total: 0, totalPages: 0, page: 1, pageSize: 20 });
      } catch (error) {
        console.error('Error fetching products:', error);
        addNotification({
          type: 'error',
          title: 'Ошибка загрузки',
          message: 'Ошибка загрузки товаров',
        });
      } finally {
        setLoading(false);
      }
    },
    [addNotification]
  );

  useEffect(() => {
    if (isOpen) {
      fetchProducts(debouncedSearch, 1);
      setPage(1);
      setSelectedProducts(new Map());
    }
  }, [isOpen, debouncedSearch, fetchProducts]);

  const handleLoadMore = () => {
    if (!loading && page < pagination.totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(debouncedSearch, nextPage);
    }
  };

  const handleProductSelect = (product: Product, color: string | null = null) => {
    const key = `${product.id}-${color || 'no-color'}`;
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      if (newMap.has(key)) {
        newMap.delete(key);
      } else {
        newMap.set(key, { product, qty: 1, color });
      }
      return newMap;
    });
  };

  const handleQtyChange = (key: string, qty: number) => {
    if (qty < 1) return;
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      const item = newMap.get(key);
      if (item) {
        newMap.set(key, { ...item, qty });
      }
      return newMap;
    });
  };

  const handleAddProducts = async () => {
    if (selectedProducts.size === 0) {
      addNotification({
        type: 'warning',
        title: 'Внимание',
        message: 'Выберите товары для добавления',
      });
      return;
    }

    setAddingProducts(true);
    try {
      const promises = Array.from(selectedProducts.values()).map(({ product, qty, color }) =>
        fetch(`/api/admin/orders/${orderId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product.id,
            qty,
            color,
          }),
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        addNotification({
          type: 'success',
          title: 'Товары добавлены',
          message: `Добавлено товаров: ${successful}${failed > 0 ? `, ошибок: ${failed}` : ''}`,
        });
        onProductAdded();
        onClose();
      } else {
        addNotification({
          type: 'error',
          title: 'Ошибка',
          message: 'Не удалось добавить товары',
        });
      }
    } catch (error) {
      console.error('Error adding products:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Ошибка при добавлении товаров',
      });
    } finally {
      setAddingProducts(false);
    }
  };

  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    // Check if it's a valid URL (starts with http://, https://, or /)
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  const getProductColors = (product: Product): string[] => {
    const colors = new Set<string>();
    product.images.forEach(img => {
      if (img.color) {
        colors.add(img.color);
      }
    });
    return Array.from(colors);
  };

  const isProductSelected = (product: Product, color: string | null = null): boolean => {
    const key = `${product.id}-${color || 'no-color'}`;
    return selectedProducts.has(key);
  };

  const getSelectedQty = (product: Product, color: string | null = null): number => {
    const key = `${product.id}-${color || 'no-color'}`;
    return selectedProducts.get(key)?.qty || 1;
  };

  // Loading skeleton component that matches product card height
  const ProductCardSkeleton = () => (
    <div className="relative flex flex-col rounded-lg border-2 border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="relative mb-2 h-32 w-full animate-pulse overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-1 h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-1 h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-2 h-4 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mt-auto h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Добавить товары в заказ"
      size="fullscreen"
      className="!max-w-full"
    >
      <div className="flex h-full flex-col">
        {/* Search Bar */}
        <div className="flex-shrink-0 border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск товаров по названию, артикулу..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Products List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ProductCardSkeleton key={`initial-skeleton-${index}`} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'Товары не найдены' : 'Начните поиск товаров'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.flatMap(product => {
                  const colors = getProductColors(product);
                  const hasColors = colors.length > 0;

                  if (hasColors) {
                    // Show product with color options - each color as separate grid item
                    return colors.map(color => {
                      const colorImages = product.images.filter(
                        img => img.color === color
                      );
                      const primaryImage = colorImages[0] || product.images[0];
                      const isSelected = isProductSelected(product, color);
                      const qty = getSelectedQty(product, color);

                      return (
                        <div
                          key={`${product.id}-${color}`}
                          className={`relative flex flex-col rounded-lg border-2 p-3 transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800'
                          }`}
                        >
                              <div className="flex gap-3">
                                {primaryImage && isValidImageUrl(primaryImage.url) ? (
                                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                                    <Image
                                      src={primaryImage.url}
                                      alt={primaryImage.alt || product.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <svg
                                        className="h-8 w-8 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {product.name || 'Без названия'}
                                  </h3>
                                  {product.article && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Арт: {product.article}
                                    </p>
                                  )}
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {color}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {new Intl.NumberFormat('ru-RU', {
                                      style: 'currency',
                                      currency: 'RUB',
                                      minimumFractionDigits: 0,
                                    }).format(Number(product.pricePair))}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="mt-2 flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleQtyChange(
                                        `${product.id}-${color}`,
                                        qty - 1
                                      )
                                    }
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                                  >
                                    <span className="text-sm">−</span>
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={qty}
                                    onChange={e =>
                                      handleQtyChange(
                                        `${product.id}-${color}`,
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="h-8 w-16 rounded border border-gray-300 text-center text-sm dark:border-gray-600 dark:bg-gray-800"
                                  />
                                  <button
                                    onClick={() =>
                                      handleQtyChange(
                                        `${product.id}-${color}`,
                                        qty + 1
                                      )
                                    }
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                                  >
                                    <span className="text-sm">+</span>
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => handleProductSelect(product, color)}
                                className={`mt-auto w-full cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <X className="mr-1 inline h-4 w-4" />
                                    Убрать
                                  </>
                                ) : (
                                  <>
                                    <Plus className="mr-1 inline h-4 w-4" />
                                    Добавить
                                  </>
                                )}
                              </button>
                        </div>
                      );
                    });
                  } else {
                    // Show product without colors
                    const primaryImage = product.images[0];
                    const isSelected = isProductSelected(product, null);
                    const qty = getSelectedQty(product, null);

                    return (
                      <div
                        key={`${product.id}-no-color`}
                        className={`relative flex flex-col rounded-lg border-2 p-3 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                            {primaryImage && isValidImageUrl(primaryImage.url) ? (
                              <Image
                                src={primaryImage.url}
                                alt={primaryImage.alt || product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                <svg
                                  className="h-8 w-8 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {product.name || 'Без названия'}
                            </h3>
                            {product.article && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Арт: {product.article}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                                minimumFractionDigits: 0,
                              }).format(Number(product.pricePair))}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="mb-2 mt-2 flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleQtyChange(`${product.id}-no-color`, qty - 1)
                              }
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                              <span className="text-sm">−</span>
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={qty}
                              onChange={e =>
                                handleQtyChange(
                                  `${product.id}-no-color`,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="h-8 w-16 rounded border border-gray-300 text-center text-sm dark:border-gray-600 dark:bg-gray-800"
                            />
                            <button
                              onClick={() =>
                                handleQtyChange(`${product.id}-no-color`, qty + 1)
                              }
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                              <span className="text-sm">+</span>
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => handleProductSelect(product, null)}
                          className={`mt-auto w-full cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <X className="mr-1 inline h-4 w-4" />
                              Убрать
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1 inline h-4 w-4" />
                              Добавить
                            </>
                          )}
                        </button>
                      </div>
                    );
                  }
                })}

                {/* Loading skeletons when loading more - only show if actually loading and there are more pages */}
                {loading && products.length > 0 && page < pagination.totalPages && (
                  <>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <ProductCardSkeleton key={`skeleton-${index}`} />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Load More */}
            {!loading && page < pagination.totalPages && (
              <div className="mt-4 text-center">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  disabled={loading}
                >
                  Загрузить еще
                </Button>
              </div>
            )}
          </div>

          {/* Selected Products Sidebar */}
          {selectedProducts.size > 0 && (
            <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Выбрано: {selectedProducts.size}
              </h3>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {Array.from(selectedProducts.entries()).map(([key, { product, qty, color }]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </p>
                        {color && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{color}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Кол-во: {qty}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProducts(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(key);
                            return newMap;
                          });
                        }}
                        className="ml-2 cursor-pointer text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Button
                  onClick={handleAddProducts}
                  disabled={addingProducts}
                  className="w-full"
                >
                  {addingProducts ? 'Добавление...' : `Добавить ${selectedProducts.size} товар(ов)`}
                </Button>
                <Button
                  onClick={() => setSelectedProducts(new Map())}
                  variant="outline"
                  className="w-full"
                >
                  Очистить
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
