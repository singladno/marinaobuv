'use client';

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Рекомендуемые' },
  { value: 'price-low', label: 'Цена: по возрастанию' },
  { value: 'price-high', label: 'Цена: по убыванию' },
  { value: 'name-asc', label: 'Название: А-Я' },
  { value: 'name-desc', label: 'Название: Я-А' },
  { value: 'rating', label: 'Высокий рейтинг' },
];

type Props = {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
};

export function SortFilter({ sortBy, onSortChange }: Props) {
  return (
    <Card className="p-4">
      <div className="mb-4">
        <Text className="text-sm font-semibold">Сортировка</Text>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Сортировать по</Label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
