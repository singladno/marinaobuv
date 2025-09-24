'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type CartItem = {
  slug: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  totalQty: number;
  add: (slug: string, qty?: number) => void;
  remove: (slug: string) => void;
  updateQuantity: (slug: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('cart_items')
          : null;
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          // sanitize loaded items
          const sanitized = parsed
            .filter(i => typeof i?.slug === 'string' && i.slug.trim() !== '')
            .map(i => ({ slug: i.slug, qty: Math.max(1, Number(i.qty) || 1) }));
          setItems(sanitized);
        }
      }
    } catch {}
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('cart_items', JSON.stringify(items));
      }
    } catch {}
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      totalQty: items.reduce((sum, i) => sum + i.qty, 0),
      add: (slug: string, qty: number = 1) => {
        if (!slug || typeof slug !== 'string' || slug.trim() === '') return;
        setItems(prev => {
          const existing = prev.find(i => i.slug === slug);
          if (existing) {
            return prev.map(i =>
              i.slug === slug ? { ...i, qty: i.qty + qty } : i
            );
          }
          return [...prev, { slug, qty }];
        });
      },
      remove: (slug: string) => {
        setItems(prev => prev.filter(i => i.slug !== slug));
      },
      updateQuantity: (slug: string, qty: number) => {
        setItems(prev => {
          if (qty <= 0) {
            return prev.filter(i => i.slug !== slug);
          }
          return prev.map(i => (i.slug === slug ? { ...i, qty } : i));
        });
      },
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
