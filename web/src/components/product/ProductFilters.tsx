'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterOptions {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  minRating: number;
  inStock: boolean;
  sortBy: string;
}

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Рекомендуемые' },
  { value: 'price-low', label: 'Цена: по возрастанию' },
  { value: 'price-high', label: 'Цена: по убыванию' },
  { value: 'name-asc', label: 'Название: А-Я' },
  { value: 'name-desc', label: 'Название: Я-А' },
  { value: 'rating', label: 'Высокий рейтинг' },
];

export default function ProductFilters({
  onFiltersChange,
  onClearFilters,
  className = '',
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    brands: [],
    priceRange: [0, 50000],
    minRating: 0,
    inStock: false,
    sortBy: 'featured',
  });

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    updateFilters({ categories: newCategories });
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...filters.brands, brand]
      : filters.brands.filter(b => b !== brand);
    updateFilters({ brands: newBrands });
  };

  const handlePriceRangeChange = (value: number[]) => {
    updateFilters({ priceRange: [value[0], value[1]] });
  };

  const handleClearAll = () => {
    const defaultFilters: FilterOptions = {
      categories: [],
      brands: [],
      priceRange: [0, 50000],
      minRating: 0,
      inStock: false,
      sortBy: 'featured',
    };
    setFilters(defaultFilters);
    onClearFilters();
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 50000 ||
    filters.minRating > 0 ||
    filters.inStock;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5" />
          <Text variant="h3" className="text-lg font-semibold">
            Фильтры
          </Text>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="gap-2"
          >
            <XMarkIcon className="h-4 w-4" />
            Очистить
          </Button>
        )}
      </div>

      {/* Sort */}
      <Card className="p-4">
        <div className="mb-3">
          <Text className="text-sm font-semibold">Сортировка</Text>
        </div>
        <div>
          <Select
            value={filters.sortBy}
            onValueChange={value => updateFilters({ sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue
                value={
                  SORT_OPTIONS.find(opt => opt.value === filters.sortBy)?.label
                }
              />
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
      </Card>

      {/* Categories */}
      <Card className="p-4">
        <div className="mb-3">
          <Text className="text-sm font-semibold">Категории</Text>
        </div>
        <div className="space-y-3">
          {['Обувь', 'Аксессуары', 'Спорт', 'Классика', 'Повседневная'].map(
            category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={checked =>
                    handleCategoryChange(category, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="text-sm font-normal"
                >
                  {category}
                </Label>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Brands */}
      <Card className="p-4">
        <div className="mb-3">
          <Text className="text-sm font-semibold">Бренды</Text>
        </div>
        <div className="space-y-3">
          {['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance'].map(brand => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={filters.brands.includes(brand)}
                onCheckedChange={checked =>
                  handleBrandChange(brand, checked as boolean)
                }
              />
              <Label htmlFor={`brand-${brand}`} className="text-sm font-normal">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Price Range */}
      <Card className="p-4">
        <div className="mb-3">
          <Text className="text-sm font-semibold">Цена</Text>
        </div>
        <div className="space-y-4">
          <Slider
            value={filters.priceRange}
            onValueChange={handlePriceRangeChange}
            max={50000}
            min={0}
            step={1000}
            className="w-full"
          />
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>{filters.priceRange[0].toLocaleString()} ₽</span>
            <span>{filters.priceRange[1].toLocaleString()} ₽</span>
          </div>
        </div>
      </Card>

      {/* Stock Status */}
      <Card className="p-4">
        <div className="mb-3">
          <Text className="text-sm font-semibold">Наличие</Text>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-stock"
              checked={filters.inStock}
              onCheckedChange={checked =>
                updateFilters({ inStock: checked as boolean })
              }
            />
            <Label htmlFor="in-stock" className="text-sm font-normal">
              Только в наличии
            </Label>
          </div>
        </div>
      </Card>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Card className="p-4">
          <div className="mb-3">
            <Text className="text-sm font-semibold">Активные фильтры</Text>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {filters.categories.map(category => (
                <Badge key={category} variant="secondary" className="gap-1">
                  {category}
                  <XMarkIcon
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleCategoryChange(category, false)}
                  />
                </Badge>
              ))}
              {filters.brands.map(brand => (
                <Badge key={brand} variant="secondary" className="gap-1">
                  {brand}
                  <XMarkIcon
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleBrandChange(brand, false)}
                  />
                </Badge>
              ))}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) && (
                <Badge variant="secondary" className="gap-1">
                  {filters.priceRange[0].toLocaleString()} -{' '}
                  {filters.priceRange[1].toLocaleString()} ₽
                  <XMarkIcon
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters({ priceRange: [0, 50000] })}
                  />
                </Badge>
              )}
              {filters.inStock && (
                <Badge variant="secondary" className="gap-1">
                  В наличии
                  <XMarkIcon
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters({ inStock: false })}
                  />
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
