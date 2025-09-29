'use client';

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import { Text } from '@/components/ui/Text';

type Props = {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
};

export function PriceFilter({ priceRange, onPriceRangeChange }: Props) {
  return (
    <Card className="p-4">
      <div className="mb-4">
        <Text className="text-sm font-semibold">Цена</Text>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">
            {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}{' '}
            ₽
          </Label>
          <Slider
            value={priceRange}
            onValueChange={value =>
              onPriceRangeChange([value[0], value[1]] as [number, number])
            }
            min={0}
            max={50000}
            step={100}
            className="mt-2"
          />
        </div>
      </div>
    </Card>
  );
}
