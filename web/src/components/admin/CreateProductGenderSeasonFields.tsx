'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';

import type { CreateProductData } from './CreateProductModal';

const GENDER_OPTIONS = [
  { value: 'FEMALE', label: 'Женская' },
  { value: 'MALE', label: 'Мужская' },
];

const SEASON_OPTIONS = [
  { value: 'SPRING', label: 'Весна' },
  { value: 'SUMMER', label: 'Лето' },
  { value: 'AUTUMN', label: 'Осень' },
  { value: 'WINTER', label: 'Зима' },
];

interface CreateProductGenderSeasonFieldsProps {
  formData: Partial<CreateProductData>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onFieldChange: (field: keyof CreateProductData, value: any) => void;
  onClearError: (field: string) => void;
}

export function CreateProductGenderSeasonFields({
  formData,
  errors,
  isSubmitting,
  onFieldChange,
  onClearError,
}: CreateProductGenderSeasonFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Text variant="body" className="font-medium text-gray-900 dark:text-white">
          Пол <span className="text-red-500">*</span>
        </Text>
        <Select
          value={formData.gender || ''}
          onValueChange={value => {
            onFieldChange('gender', value ? (value as 'FEMALE' | 'MALE') : null);
            onClearError('gender');
          }}
          disabled={isSubmitting}
        >
          <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
            <SelectValue placeholder="Выберите пол" />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.gender && (
          <Text variant="caption" className="text-red-500">
            {errors.gender}
          </Text>
        )}
      </div>

      <div className="space-y-2">
        <Text variant="body" className="font-medium text-gray-900 dark:text-white">
          Сезон <span className="text-red-500">*</span>
        </Text>
        <Select
          value={formData.season || ''}
          onValueChange={value => {
            onFieldChange(
              'season',
              value ? (value as 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER') : null
            );
            onClearError('season');
          }}
          disabled={isSubmitting}
        >
          <SelectTrigger className={errors.season ? 'border-red-500' : ''}>
            <SelectValue placeholder="Выберите сезон" />
          </SelectTrigger>
          <SelectContent>
            {SEASON_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.season && (
          <Text variant="caption" className="text-red-500">
            {errors.season}
          </Text>
        )}
      </div>
    </div>
  );
}
