import { useEffect, useState } from 'react';

type CartItem = {
  slug: string;
  qty: number;
};

export function useCartLogic() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Get cart storage key based on user
  const getCartKey = (uid: string | null) => {
    return uid ? `cart_items_${uid}` : 'cart_items_anonymous';
  };

  // Load from localStorage based on current user
  useEffect(() => {
    try {
      const key = getCartKey(userId);
      const raw =
        typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;

      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          // sanitize loaded items
          const sanitized = parsed
            .filter(i => typeof i?.slug === 'string' && i.slug.trim() !== '')
            .map(i => ({
              slug: i.slug.trim(),
              qty: typeof i.qty === 'number' && i.qty > 0 ? i.qty : 1,
            }));

          // Only set items if they're different to avoid infinite loops
          setItems(prevItems => {
            const prevSlugs = prevItems
              .map(i => i.slug)
              .sort()
              .join(',');
            const newSlugs = sanitized
              .map(i => i.slug)
              .sort()
              .join(',');
            return prevSlugs === newSlugs ? prevItems : sanitized;
          });
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }, [userId]);

  // Save to localStorage whenever items or userId changes
  useEffect(() => {
    try {
      const key = getCartKey(userId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(items));
      }
    } catch {
      // ignore localStorage errors
    }
  }, [items, userId]);

  const add = (slug: string, qty: number = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.slug === slug);
      if (existing) {
        return prev.map(i =>
          i.slug === slug ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { slug, qty }];
    });
  };

  const remove = (slug: string) => {
    setItems(prev => prev.filter(i => i.slug !== slug));
  };

  const updateQuantity = (slug: string, qty: number) => {
    if (qty <= 0) {
      remove(slug);
      return;
    }
    setItems(prev => prev.map(i => (i.slug === slug ? { ...i, qty } : i)));
  };

  const clear = () => {
    setItems([]);
  };

  return {
    items,
    userId,
    setUserId,
    add,
    remove,
    updateQuantity,
    clear,
  };
}
