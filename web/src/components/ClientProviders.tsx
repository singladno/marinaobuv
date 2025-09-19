'use client';

import { HighlightedProductsProvider } from '@/contexts/HighlightedProductsContext';
import { NotificationProvider } from '@/components/ui/NotificationProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <NotificationProvider>
      <HighlightedProductsProvider>{children}</HighlightedProductsProvider>
    </NotificationProvider>
  );
}
