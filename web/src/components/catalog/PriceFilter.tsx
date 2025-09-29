import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';

interface PriceFilterProps {
  bounds: { min: number; max: number };
  priceFrom?: number;
  priceTo?: number;
}

export function PriceFilter({ bounds, priceFrom, priceTo }: PriceFilterProps) {
  return (
    <div className="flex items-end gap-2">
      <div>
        <Text as="label" className="text-muted mb-1 block text-xs">
          Цена от, ₽
        </Text>
        <Input
          type="number"
          name="priceFrom"
          placeholder={String(bounds.min ?? '')}
          defaultValue={priceFrom ?? ''}
          className="w-28"
        />
      </div>
      <div>
        <Text as="label" className="text-muted mb-1 block text-xs">
          до
        </Text>
        <Input
          type="number"
          name="priceTo"
          placeholder={String(bounds.max ?? '')}
          defaultValue={priceTo ?? ''}
          className="w-28"
        />
      </div>
    </div>
  );
}
