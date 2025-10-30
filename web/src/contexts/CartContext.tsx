'use client';

import React, { createContext, useContext, useMemo } from 'react';

import { useCartLogic } from '@/hooks/useCartLogic';
import { useFlyingAnimationContext } from './FlyingAnimationContext';

type CartItem = {
  slug: string;
  qty: number;
  color?: string | null;
};

type CartContextValue = {
  items: CartItem[];
  totalQty: number;
  add: (
    slug: string,
    qty?: number,
    productData?: { imageUrl: string; name: string },
    color?: string | null
  ) => void;
  remove: (slug: string, color?: string | null) => void;
  updateQuantity: (slug: string, qty: number, color?: string | null) => void;
  clear: () => void;
  userId: string | null;
  setUserId: (userId: string | null) => void;
  removeInvalidItems: (validSlugs: string[]) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { items, userId, setUserId, add, remove, updateQuantity, clear } =
    useCartLogic();
  // Try to get flying animation context, but don't fail if it's not available
  let triggerFlyingAnimation: ((productData: any) => void) | undefined;
  try {
    const flyingContext = useFlyingAnimationContext();
    triggerFlyingAnimation = flyingContext.triggerFlyingAnimation;
  } catch {
    // Flying animation context not available, continue without it
  }

  const totalQty = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }, [items]);

  const removeInvalidItems = useMemo(() => {
    return (validSlugs: string[]) => {
      const validSlugSet = new Set(validSlugs);
      items.forEach(item => {
        if (!validSlugSet.has(item.slug)) {
          remove(item.slug);
        }
      });
    };
  }, [items, remove]);

  const addWithAnimation = (
    slug: string,
    qty: number = 1,
    productData?: { imageUrl: string; name: string },
    color?: string | null
  ) => {
    // Add to cart first
    add(slug, qty, color ?? null);
    // Trigger flying animation if product data is provided and context is available
    if (productData && triggerFlyingAnimation) {
      triggerFlyingAnimation({
        slug,
        imageUrl: productData.imageUrl,
        name: productData.name,
      });
    }
  };

  const value: CartContextValue = {
    items,
    totalQty,
    add: addWithAnimation,
    remove,
    updateQuantity,
    clear,
    userId,
    setUserId,
    removeInvalidItems,
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
