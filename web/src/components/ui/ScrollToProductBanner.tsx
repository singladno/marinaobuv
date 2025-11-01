'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScrollToProductBannerProps {
  isVisible: boolean;
}

export function ScrollToProductBanner({ isVisible }: ScrollToProductBannerProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      // Delay unmount to allow fade-out animation
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible
          ? 'animate-in slide-in-from-top fade-in-0'
          : 'animate-out slide-out-to-top fade-out-0'
      }`}
    >
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">
                Возвращаемся к вашему товару...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

