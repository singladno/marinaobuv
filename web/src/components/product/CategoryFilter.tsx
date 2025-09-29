'use client';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';

type Props = {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (category: string, checked: boolean) => void;
};

export function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryChange,
}: Props) {
  return (
    <Card className="p-4">
      <div className="mb-4">
        <Text className="text-sm font-semibold">Категории</Text>
      </div>
      <div className="space-y-3">
        {categories.map(category => (
          <div key={category} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${category}`}
              checked={selectedCategories.includes(category)}
              onCheckedChange={checked =>
                onCategoryChange(category, checked as boolean)
              }
            />
            <Label
              htmlFor={`category-${category}`}
              className="text-sm font-normal"
            >
              {category}
            </Label>
          </div>
        ))}
      </div>
    </Card>
  );
}
