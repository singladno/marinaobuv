'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type FavoritesContextValue = {
  favorites: Set<string>;
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('favorites');
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        setFavorites(new Set(arr));
      }
    } catch {}
  }, []);

  // Persist to localStorage when changed
  useEffect(() => {
    try {
      const arr = Array.from(favorites);
      localStorage.setItem('favorites', JSON.stringify(arr));
    } catch {}
  }, [favorites]);

  const value = useMemo<FavoritesContextValue>(() => {
    return {
      favorites,
      isFavorite: (slug: string) => favorites.has(slug),
      toggleFavorite: (slug: string) => {
        setFavorites(prev => {
          const next = new Set(prev);
          if (next.has(slug)) next.delete(slug);
          else next.add(slug);
          return next;
        });
      },
    };
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
