'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

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

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      totalQty: items.reduce((sum, i) => sum + i.qty, 0),
      add: (slug: string, qty: number = 1) => {
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
