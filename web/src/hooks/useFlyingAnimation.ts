'use client';

import { useCallback, useRef, useState } from 'react';

export interface FlyingProductData {
  id: string;
  imageUrl: string;
  name: string;
  slug: string;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
}

export interface FlyingAnimationState {
  isAnimating: boolean;
  flyingProducts: FlyingProductData[];
}

export function useFlyingAnimation() {
  const [state, setState] = useState<FlyingAnimationState>({
    isAnimating: false,
    flyingProducts: [],
  });

  const animationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const triggerFlyingAnimation = useCallback(
    (
      productData: Omit<
        FlyingProductData,
        'id' | 'startPosition' | 'endPosition'
      >
    ) => {
      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Generate unique ID for this animation
      const id = `flying-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get start position (where the button was clicked)
      const startButton = document.querySelector(
        `[data-product-slug="${productData.slug}"]`
      );
      const startRect = startButton?.getBoundingClientRect();

      if (!startRect) {
        console.warn('Could not find start position for flying animation');
        return;
      }

      // Get end position (cart icon)
      const cartIcon = document.querySelector('[data-cart-icon]');
      const endRect = cartIcon?.getBoundingClientRect();

      if (!endRect) {
        console.warn('Could not find cart icon for flying animation');
        return;
      }

      const flyingProduct: FlyingProductData = {
        id,
        ...productData,
        startPosition: {
          x: startRect.left + startRect.width / 2,
          y: startRect.top + startRect.height / 2,
        },
        endPosition: {
          x: endRect.left + endRect.width / 2,
          y: endRect.top + endRect.height / 2,
        },
      };

      // Add the flying product to state
      setState(prev => ({
        isAnimating: true,
        flyingProducts: [...prev.flyingProducts, flyingProduct],
      }));

      // Remove the flying product after animation completes
      animationTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          isAnimating: false,
          flyingProducts: prev.flyingProducts.filter(p => p.id !== id),
        }));
      }, 1000); // Animation duration + cleanup time
    },
    []
  );

  const clearAnimations = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setState({
      isAnimating: false,
      flyingProducts: [],
    });
  }, []);

  return {
    ...state,
    triggerFlyingAnimation,
    clearAnimations,
  };
}
