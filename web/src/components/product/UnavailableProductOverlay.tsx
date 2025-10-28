'use client';

import { cn } from '@/lib/utils';

interface UnavailableProductOverlayProps {
  className?: string;
}

export function UnavailableProductOverlay({
  className,
}: UnavailableProductOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center',
        'bg-gray-900/60 backdrop-blur-sm',
        'transition-all duration-300',
        className
      )}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">Нет в наличии</h3>
        <p className="mt-1 text-sm text-white">Товар временно недоступен</p>
      </div>
    </div>
  );
}
