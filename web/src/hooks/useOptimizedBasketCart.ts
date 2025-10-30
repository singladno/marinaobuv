import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';

interface Product {
  id: string;
  slug: string;
  name: string;
  pricePair: number;
  images: Array<{ url: string; alt?: string }>;
  category: { name: string };
  article?: string;
  sizes: Array<{ size: string; count: number }>;
}

interface CartItemWithProduct {
  slug: string;
  qty: number;
  color?: string | null;
  product: Product;
}

export function useOptimizedBasketCart() {
  const { items, remove, updateQuantity, clear, removeInvalidItems } =
    useCart();
  const { addNotification } = useNotifications();
  const { favorites, toggleFavorite } = useFavorites();

  const [products, setProducts] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const prevSlugsRef = useRef<string>('');
  const isRemovingRef = useRef<boolean>(false);

  // Memoize total price calculation
  const totalPrice = useMemo(
    () =>
      products.reduce(
        (sum, item) => sum + item.product.pricePair * item.qty,
        0
      ),
    [products]
  );

  // Fetch only the products that are in the cart
  const fetchBasketProducts = useCallback(
    async (
      cartItems: { slug: string; qty: number; color?: string | null }[]
    ) => {
      if (cartItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const uniqueSlugs = Array.from(new Set(cartItems.map(i => i.slug)));
        const response = await fetch('/api/basket/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slugs: uniqueSlugs }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch basket products');
        }

        const data = await response.json();

        // Find slugs that exist in the database
        const validSlugs = data.products.map((p: any) => p.slug);

        // Clean up invalid items from cart context
        const invalidItems = items.filter(
          item => !validSlugs.includes(item.slug)
        );
        if (invalidItems.length > 0) {
          console.log(
            'Removing invalid cart items:',
            invalidItems.map(item => item.slug)
          );
          removeInvalidItems(validSlugs);

          // Show notification about removed items
          addNotification({
            type: 'info',
            title: 'Корзина обновлена',
            message: `Удалено ${invalidItems.length} недоступных товаров из корзины`,
          });
        }

        // Convert current cart items to view model with real product data
        const productsWithData: CartItemWithProduct[] = cartItems
          .map(ci => {
            const product = data.products.find((p: any) => p.slug === ci.slug);
            if (!product) return null;
            return {
              slug: ci.slug,
              qty: ci.qty,
              color: (ci as any).color ?? null,
              product: {
                id: product.id,
                slug: product.slug,
                name: product.name,
                pricePair: product.pricePair,
                images: product.images || [],
                category: product.category || { name: 'Unknown' },
                article: product.article,
                sizes: product.sizes || [],
              },
            };
          })
          .filter(Boolean) as CartItemWithProduct[];

        setProducts(productsWithData);
      } catch (error) {
        console.error('Error fetching basket products:', error);
        // Fallback to empty array
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [items, removeInvalidItems, addNotification]
  );

  // Fetch products only on initial load or when new items are added
  useEffect(() => {
    // Skip if we're in the middle of removing an item
    if (isRemovingRef.current) {
      return;
    }

    const compositeKeys = items.map(
      item => `${item.slug}::${(item as any).color ?? ''}`
    );
    const keysString = compositeKeys.join(',');

    // Always handle the empty-cart case to avoid stuck loading on first render
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      prevSlugsRef.current = '';
      return;
    }

    // Only fetch if this is a new set of items (not just a removal)
    if (keysString !== prevSlugsRef.current) {
      prevSlugsRef.current = keysString;
      fetchBasketProducts(
        items.map(i => ({
          slug: i.slug,
          qty: i.qty,
          color: (i as any).color ?? null,
        }))
      );
    }
  }, [items, fetchBasketProducts]);

  const handleRemoveItem = useCallback(
    (slug: string, color?: string | null) => {
      // Mark that we're removing an item to prevent useEffect from triggering
      isRemovingRef.current = true;

      // Mark item as removing to show local loader
      const key = `${slug}::${color ?? ''}`;
      setRemovingItems(prev => new Set(prev).add(key));

      // Remove from context (this is synchronous and fast)
      remove(slug, color ?? null);

      // Update local state optimistically
      setProducts(prev =>
        prev.filter(
          item =>
            !(item.slug === slug && (item.color ?? null) === (color ?? null))
        )
      );

      // Show notification
      addNotification({
        type: 'success',
        title: 'Товар удален',
        message: 'Товар удален из корзины',
      });

      // Remove from removing set after a short delay for visual feedback
      setTimeout(() => {
        setRemovingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        // Reset the removing flag
        isRemovingRef.current = false;
      }, 500);
    },
    [remove, addNotification]
  );

  const handleUpdateQuantity = useCallback(
    async (slug: string, qty: number, color?: string | null) => {
      if (qty <= 0) {
        handleRemoveItem(slug, color ?? null);
        return;
      }

      // Mark item as updating to prevent UI blocking
      const key = `${slug}::${color ?? ''}`;
      setUpdatingItems(prev => new Set(prev).add(key));

      try {
        // Update quantity in context (this is synchronous and fast)
        updateQuantity(slug, qty, color ?? null);

        // Update local state optimistically
        setProducts(prev =>
          prev.map(item =>
            item.slug === slug && (item.color ?? null) === (color ?? null)
              ? { ...item, qty }
              : item
          )
        );
      } catch (error) {
        console.error('Error updating quantity:', error);
        addNotification({
          type: 'error',
          title: 'Ошибка',
          message: 'Не удалось обновить количество товара',
        });
      } finally {
        // Remove from updating set
        setUpdatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    },
    [updateQuantity, handleRemoveItem, addNotification]
  );

  const handleClearCart = useCallback(() => {
    clear();
    addNotification({
      type: 'success',
      title: 'Корзина очищена',
      message: 'Все товары удалены из корзины',
    });
  }, [clear, addNotification]);

  const handleToggleFavorite = useCallback(
    (slug: string) => {
      toggleFavorite(slug);
      const isCurrentlyFavorite = favorites.has(slug);
      addNotification({
        type: 'success',
        title: isCurrentlyFavorite
          ? 'Удалено из избранного'
          : 'Добавлено в избранное',
        message: isCurrentlyFavorite
          ? 'Товар удален из избранного'
          : 'Товар добавлен в избранное',
      });
    },
    [toggleFavorite, favorites, addNotification]
  );

  return {
    products,
    loading,
    totalPrice,
    updatingItems,
    removingItems,
    favorites,
    handleRemoveItem,
    handleUpdateQuantity,
    handleClearCart,
    handleToggleFavorite,
  };
}
