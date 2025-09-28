'use client';

import { NotificationProvider } from '@/components/ui/NotificationProvider';
import { CartProvider } from '@/contexts/CartContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { HighlightedProductsProvider } from '@/contexts/HighlightedProductsContext';

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
