'use client';

import { useMemo } from 'react';
import { rub } from '@/lib/format';

type Props = {
  pricePair: number;
  sizes: Array<{ size: string; count: number }>; // Array of size objects like [{size: '36', count: 1}, {size: '38', count: 2}]
  packPairs: number | null;
  boxPrice: number | null;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
};

export function ProductPricing({
  pricePair,
  sizes,
  packPairs,
  boxPrice,
  quantity,
  onQuantityChange,
}: Props) {
  // Merge duplicate sizes to avoid duplicate React keys and show summed counts
  const mergedSizes = useMemo(() => {
    const sizeToCount = new Map<string, number>();
    for (const sizeObj of sizes) {
      const sizeKey = String(sizeObj.size);
      const current = sizeToCount.get(sizeKey) ?? 0;
      sizeToCount.set(sizeKey, current + Number(sizeObj.count || 0));
    }
    return Array.from(sizeToCount.entries()).map(([size, count]) => ({
      size,
      count,
    }));
  }, [sizes]);

  // Calculate total available stock across all merged sizes
  const totalStock = mergedSizes.reduce(
    (total, sizeObj) => total + sizeObj.count,
    0
  );

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= totalStock) {
      onQuantityChange(newQuantity);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{rub(pricePair)}</span>
          <span className="text-muted-foreground text-sm">за пару</span>
        </div>
        {boxPrice != null && packPairs != null && (
          <div className="text-muted-foreground text-sm">
            {rub(boxPrice)} за коробку ({packPairs} пар)
          </div>
        )}
      </div>

      {/* Size Display */}
      <div className="space-y-3">
        <h3 className="font-medium">Размеры</h3>
        <div className="flex flex-wrap gap-2">
          {mergedSizes.map(sizeObj => (
            <div
              key={sizeObj.size}
              className="flex flex-col items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm"
            >
              <span className="font-medium text-gray-900">{sizeObj.size}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                {sizeObj.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="space-y-3">
        <h3 className="font-medium">Количество</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-lg border disabled:opacity-50"
          >
            -
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= totalStock}
            className="flex h-10 w-10 items-center justify-center rounded-lg border disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
