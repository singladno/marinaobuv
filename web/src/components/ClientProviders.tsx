'use client';

import { SessionProvider } from 'next-auth/react';
import { NotificationProvider } from '@/components/ui/NotificationProvider';
import { CartProvider } from '@/contexts/CartContext';
import { CategoriesProvider } from '@/contexts/CategoriesContext';
import { CategoryLookupProvider } from '@/contexts/CategoryLookupContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { FlyingAnimationProvider } from '@/contexts/FlyingAnimationContext';
import { HighlightedProductsProvider } from '@/contexts/HighlightedProductsContext';
import { NextAuthUserProvider } from '@/contexts/NextAuthUserContext';
import { AdminChatProvider } from '@/contexts/AdminChatContext';
import { ClientChatProvider } from '@/contexts/ClientChatContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <NotificationProvider>
        <NextAuthUserProvider>
          <AdminChatProvider>
            <ClientChatProvider>
              <CategoriesProvider>
                <CategoryLookupProvider>
                  <HighlightedProductsProvider>
                    <FavoritesProvider>
                      <FlyingAnimationProvider>
                        <CartProvider>{children}</CartProvider>
                      </FlyingAnimationProvider>
                    </FavoritesProvider>
                  </HighlightedProductsProvider>
                </CategoryLookupProvider>
              </CategoriesProvider>
            </ClientChatProvider>
          </AdminChatProvider>
        </NextAuthUserProvider>
      </NotificationProvider>
    </SessionProvider>
  );
}
