import * as React from 'react';

import { useHighlightedProducts } from '@/contexts/HighlightedProductsContext';

interface HighlightedRowProps {
  draftId: string;
  children: React.ReactNode;
}

export function HighlightedRow({ draftId, children }: HighlightedRowProps) {
  const { highlightedProducts } = useHighlightedProducts();
  const isHighlighted = highlightedProducts.has(draftId);

  return (
    <div
      className={`transition-all duration-500 ${
        isHighlighted
          ? 'animate-pulse bg-blue-50 ring-4 ring-blue-500 dark:bg-blue-900/20'
          : ''
      }`}
    >
      {children}
    </div>
  );
}
