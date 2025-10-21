'use client';

import { createContext, useContext, ReactNode } from 'react';

import {
  useFlyingAnimation,
  FlyingProductData,
} from '@/hooks/useFlyingAnimation';
import { FlyingProduct } from '@/components/ui/FlyingProduct';

interface FlyingAnimationContextValue {
  triggerFlyingAnimation: (
    productData: Omit<FlyingProductData, 'id' | 'startPosition' | 'endPosition'>
  ) => void;
  clearAnimations: () => void;
  isAnimating: boolean;
  flyingProducts: FlyingProductData[];
}

const FlyingAnimationContext = createContext<
  FlyingAnimationContextValue | undefined
>(undefined);

export function FlyingAnimationProvider({ children }: { children: ReactNode }) {
  const {
    isAnimating,
    flyingProducts,
    triggerFlyingAnimation,
    clearAnimations,
  } = useFlyingAnimation();

  const handleAnimationComplete = (productId: string) => {
    // Animation completion is handled in the hook
  };

  return (
    <FlyingAnimationContext.Provider
      value={{
        triggerFlyingAnimation,
        clearAnimations,
        isAnimating,
        flyingProducts,
      }}
    >
      {children}
      {/* Render flying products */}
      {flyingProducts.map(product => (
        <FlyingProduct
          key={product.id}
          product={product}
          onComplete={() => handleAnimationComplete(product.id)}
        />
      ))}
    </FlyingAnimationContext.Provider>
  );
}

export function useFlyingAnimationContext() {
  const context = useContext(FlyingAnimationContext);
  if (context === undefined) {
    throw new Error(
      'useFlyingAnimationContext must be used within a FlyingAnimationProvider'
    );
  }
  return context;
}
