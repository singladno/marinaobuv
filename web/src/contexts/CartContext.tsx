'use client';

import React, { createContext, useContext, useMemo } from 'react';

import { useCartLogic } from '@/hooks/useCartLogic';

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
  userId: string | null;
  setUserId: (userId: string | null) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { items, userId, setUserId, add, remove, updateQuantity, clear } =
    useCartLogic();

  const totalQty = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }, [items]);

  const value: CartContextValue = {
    items,
    totalQty,
    add,
    remove,
    updateQuantity,
    clear,
    userId,
    setUserId,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
