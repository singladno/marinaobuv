'use client';

import { NotificationProvider } from '@/components/ui/NotificationProvider';
import { CartProvider } from '@/contexts/CartContext';
import { CategoriesProvider } from '@/contexts/CategoriesContext';
import { CategoryLookupProvider } from '@/contexts/CategoryLookupContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { HighlightedProductsProvider } from '@/contexts/HighlightedProductsContext';
import { UserProvider } from '@/contexts/UserContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <NotificationProvider>
      <UserProvider>
        <CategoriesProvider>
          <CategoryLookupProvider>
            <HighlightedProductsProvider>
              <FavoritesProvider>
                <CartProvider>{children}</CartProvider>
              </FavoritesProvider>
            </HighlightedProductsProvider>
          </CategoryLookupProvider>
        </CategoriesProvider>
      </UserProvider>
    </NotificationProvider>
  );
}
