import * as React from 'react';

interface HighlightedProductsContextType {
  highlightedProducts: Set<string>;
  highlightProducts: (productIds: string[]) => void;
  clearHighlight: (productId: string) => void;
  clearAllHighlights: () => void;
}

const HighlightedProductsContext = React.createContext<
  HighlightedProductsContextType | undefined
>(undefined);

export function HighlightedProductsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [highlightedProducts, setHighlightedProducts] = React.useState<
    Set<string>
  >(new Set());

  const highlightProducts = React.useCallback((productIds: string[]) => {
    setHighlightedProducts(prev => {
      const newSet = new Set(prev);
      productIds.forEach(id => newSet.add(id));
      return newSet;
    });

    // Auto-clear highlights after 2 seconds
    setTimeout(() => {
      setHighlightedProducts(prev => {
        const newSet = new Set(prev);
        productIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }, 2000);
  }, []);

  const clearHighlight = React.useCallback((productId: string) => {
    setHighlightedProducts(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  }, []);

  const clearAllHighlights = React.useCallback(() => {
    setHighlightedProducts(new Set());
  }, []);

  return (
    <HighlightedProductsContext.Provider
      value={{
        highlightedProducts,
        highlightProducts,
        clearHighlight,
        clearAllHighlights,
      }}
    >
      {children}
    </HighlightedProductsContext.Provider>
  );
}

export function useHighlightedProducts() {
  const context = React.useContext(HighlightedProductsContext);
  if (context === undefined) {
    throw new Error(
      'useHighlightedProducts must be used within a HighlightedProductsProvider'
    );
  }
  return context;
}
