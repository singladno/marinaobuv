'use client';

import { HighlightedProductsProvider } from '@/contexts/HighlightedProductsContext';
import { NotificationProvider } from '@/components/ui/NotificationProvider';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { CartProvider } from '@/contexts/CartContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <NotificationProvider>
      <HighlightedProductsProvider>
        <FavoritesProvider>
          <CartProvider>{children}</CartProvider>
        </FavoritesProvider>
      </HighlightedProductsProvider>
    </NotificationProvider>
  );
}
