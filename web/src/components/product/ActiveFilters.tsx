'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

type Props = {
  categories: string[];
  priceRange: [number, number];
  inStock: boolean;
  onCategoryChange: (category: string, checked: boolean) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onStockChange: (inStock: boolean) => void;
};

export function ActiveFilters({
  categories,
  priceRange,
  inStock,
  onCategoryChange,
  onPriceRangeChange,
  onStockChange,
}: Props) {
  const hasActiveFilters =
    categories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 50000 ||
    inStock;

  if (!hasActiveFilters) return null;

  return (
    <Card className="p-4">
      <div className="mb-3">
        <Text className="text-sm font-semibold">Активные фильтры</Text>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <XMarkIcon
                className="h-3 w-3 cursor-pointer"
                onClick={() => onCategoryChange(category, false)}
              />
            </Badge>
          ))}
          {(priceRange[0] > 0 || priceRange[1] < 50000) && (
            <Badge variant="secondary" className="gap-1">
              {priceRange[0].toLocaleString()} -{' '}
              {priceRange[1].toLocaleString()} ₽
              <XMarkIcon
                className="h-3 w-3 cursor-pointer"
                onClick={() => onPriceRangeChange([0, 50000])}
              />
            </Badge>
          )}
          {inStock && (
            <Badge variant="secondary" className="gap-1">
              В наличии
              <XMarkIcon
                className="h-3 w-3 cursor-pointer"
                onClick={() => onStockChange(false)}
              />
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
