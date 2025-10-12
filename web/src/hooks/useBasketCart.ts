import { useState, useEffect, useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCart } from '@/contexts/CartContext';

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
  product: Product;
}

export function useBasketCart() {
  const { items, remove, updateQuantity, clear } = useCart();
  const { addNotification } = useNotifications();

  const [products, setProducts] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const totalPrice = products.reduce(
    (sum, item) => sum + item.product.pricePair * item.qty,
    0
  );

  const handleRemoveItem = useCallback(
    (slug: string) => {
      remove(slug);
      addNotification({
        type: 'success',
        title: 'Товар удален',
        message: 'Товар удален из корзины',
      });
    },
    [remove, addNotification]
  );

  const handleUpdateQuantity = useCallback(
    (slug: string, qty: number) => {
      if (qty <= 0) {
        handleRemoveItem(slug);
        return;
      }
      updateQuantity(slug, qty);
    },
    [updateQuantity, handleRemoveItem]
  );

  const handleClearCart = useCallback(() => {
    clear();
    addNotification({
      type: 'success',
      title: 'Корзина очищена',
      message: 'Все товары удалены из корзины',
    });
  }, [clear, addNotification]);

  useEffect(() => {
    const fetchProductData = async () => {
      if (items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch all products and filter by cart items
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();

        // Create a map of slug to product for quick lookup
        const productMap = new Map();
        data.products.forEach((product: any) => {
          productMap.set(product.slug, product);
        });

        // Convert CartItem[] to CartItemWithProduct[] with real product data
        const productsWithData: CartItemWithProduct[] = items
          .map(item => {
            const product = productMap.get(item.slug);
            if (!product) {
              console.warn(`Product not found for slug: ${item.slug}`);
              return null;
            }
            return {
              ...item,
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
        console.error('Error fetching product data for cart:', error);
        // Fallback to placeholder data
        const productsWithData: CartItemWithProduct[] = items.map(item => ({
          ...item,
          product: {
            id: item.slug,
            slug: item.slug,
            name: `Product ${item.slug}`,
            pricePair: 0,
            images: [],
            category: { name: 'Unknown' },
            article: undefined,
            sizes: [],
          },
        }));
        setProducts(productsWithData);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [items]);

  return {
    products,
    loading,
    totalPrice,
    handleRemoveItem,
    handleUpdateQuantity,
    handleClearCart,
  };
}
