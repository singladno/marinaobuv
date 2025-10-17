'use client';

/* eslint-disable react/forbid-dom-props, @next/next/no-css-tags */
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { FlyingProductData } from '@/hooks/useFlyingAnimation';

interface FlyingProductProps {
  product: FlyingProductData;
  onComplete: () => void;
}

export function FlyingProduct({ product, onComplete }: FlyingProductProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<
    'start' | 'flying' | 'landing'
  >('start');
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start the animation sequence
    const startTimer = setTimeout(() => {
      setIsVisible(true);
      setAnimationPhase('flying');
    }, 50);

    const landingTimer = setTimeout(() => {
      setAnimationPhase('landing');
    }, 600);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(landingTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  const { startPosition, endPosition, imageUrl, name } = product;

  // Calculate the arc path for a smooth curve
  const midX = (startPosition.x + endPosition.x) / 2;
  const midY = Math.min(startPosition.y, endPosition.y) - 100; // Arc height

  const getTransform = () => {
    switch (animationPhase) {
      case 'start':
        return {
          x: startPosition.x - 25,
          y: startPosition.y - 25,
          scale: 1,
          opacity: 1,
        };
      case 'flying':
        return {
          x: midX - 25,
          y: midY - 25,
          scale: 0.7,
          opacity: 0.9,
        };
      case 'landing':
        return {
          x: endPosition.x - 15,
          y: endPosition.y - 15,
          scale: 0.3,
          opacity: 0.3,
        };
      default:
        return {
          x: startPosition.x - 25,
          y: startPosition.y - 25,
          scale: 1,
          opacity: 1,
        };
    }
  };

  const transform = getTransform();

  return (
    <div
      ref={elementRef}
      className="duration-400 pointer-events-none fixed z-50 transition-all ease-out"
      style={
        {
          '--flying-x': `${transform.x}px`,
          '--flying-y': `${transform.y}px`,
          '--flying-scale': transform.scale,
          '--flying-opacity': transform.opacity,
          transform:
            'translate(var(--flying-x), var(--flying-y)) scale(var(--flying-scale))',
          opacity: 'var(--flying-opacity)',
        } as React.CSSProperties
      }
    >
      <div className="relative">
        {/* Product image with shadow and border */}
        <div className="relative h-12 w-12 overflow-hidden rounded-lg border-2 border-white shadow-lg">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Sparkle effect during flight */}
        {animationPhase === 'flying' && (
          <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse">
            <div className="h-full w-full rounded-full bg-yellow-400 opacity-80"></div>
          </div>
        )}

        {/* Landing effect */}
        {animationPhase === 'landing' && (
          <div className="absolute inset-0 animate-ping">
            <div className="h-full w-full rounded-lg bg-green-400 opacity-20"></div>
          </div>
        )}
      </div>
    </div>
  );
}
