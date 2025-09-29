'use client';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';

type Props = {
  inStock: boolean;
  onStockChange: (inStock: boolean) => void;
};

export function StockFilter({ inStock, onStockChange }: Props) {
  return (
    <Card className="p-4">
      <div className="mb-4">
        <Text className="text-sm font-semibold">Наличие</Text>
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={inStock}
            onCheckedChange={checked => onStockChange(checked as boolean)}
          />
          <Label htmlFor="in-stock" className="text-sm font-normal">
            Только в наличии
          </Label>
        </div>
      </div>
    </Card>
  );
}
