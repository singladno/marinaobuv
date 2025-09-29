'use client';

import { rub } from '@/lib/format';

type Size = {
  id: string;
  size: string;
  stock?: number | null;
  perBox?: number | null;
};

type Props = {
  pricePair: number;
  sizes: Size[];
  packPairs: number | null;
  boxPrice: number | null;
  selectedSize: string;
  onSizeChange: (sizeId: string) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
};

export function ProductPricing({
  pricePair,
  sizes,
  packPairs,
  boxPrice,
  selectedSize,
  onSizeChange,
  quantity,
  onQuantityChange,
}: Props) {
  const selectedSizeData = sizes.find(s => s.id === selectedSize);
  const availableStock = selectedSizeData?.stock ?? 0;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) {
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

      {/* Size Selection */}
      <div className="space-y-3">
        <h3 className="font-medium">Размер</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map(size => (
            <button
              key={size.id}
              onClick={() => onSizeChange(size.id)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                selectedSize === size.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {size.size}
            </button>
          ))}
        </div>
        {selectedSizeData && (
          <p className="text-muted-foreground text-sm">
            В наличии: {availableStock} пар
          </p>
        )}
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
            disabled={quantity >= availableStock}
            className="flex h-10 w-10 items-center justify-center rounded-lg border disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
