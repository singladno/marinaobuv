'use client';

import { HighlightedProductsProvider } from '@/contexts/HighlightedProductsContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return <HighlightedProductsProvider>{children}</HighlightedProductsProvider>;
}
