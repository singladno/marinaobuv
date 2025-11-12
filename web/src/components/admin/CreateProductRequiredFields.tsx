'use client';

import { Input } from '@/components/ui/Input';
import { CategorySelector, type CategoryNode } from '@/components/ui/CategorySelector';
import { Text } from '@/components/ui/Text';

import type { CreateProductData } from './CreateProductModal';

interface CreateProductRequiredFieldsProps {
  formData: Partial<CreateProductData>;
  errors: Record<string, string>;
  categories: CategoryNode[];
  isSubmitting: boolean;
  onFieldChange: (field: keyof CreateProductData, value: any) => void;
  onClearError: (field: string) => void;
}

export function CreateProductRequiredFields({
  formData,
  errors,
  categories,
  isSubmitting,
  onFieldChange,
  onClearError,
}: CreateProductRequiredFieldsProps) {
  return (
    <>
      {/* Name - Required */}
      <div className="space-y-2">
        <Text variant="body" className="font-medium text-gray-900 dark:text-white">
          Название товара <span className="text-red-500">*</span>
        </Text>
        <Input
          type="text"
          value={formData.name || ''}
          onChange={e => {
            onFieldChange('name', e.target.value);
            onClearError('name');
          }}
          placeholder="Введите название товара..."
          disabled={isSubmitting}
          required
          fullWidth
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <Text variant="caption" className="text-red-500">
            {errors.name}
          </Text>
        )}
      </div>

      {/* Category - Required */}
      <div className="space-y-2">
        <Text variant="body" className="font-medium text-gray-900 dark:text-white">
          Категория <span className="text-red-500">*</span>
        </Text>
        <CategorySelector
          value={formData.categoryId || null}
          onChange={categoryId => {
            onFieldChange('categoryId', categoryId || '');
            onClearError('categoryId');
          }}
          categories={categories}
          placeholder="Выберите категорию"
          disabled={isSubmitting}
        />
        {errors.categoryId && (
          <Text variant="caption" className="text-red-500">
            {errors.categoryId}
          </Text>
        )}
      </div>

      {/* Price - Required */}
      <div className="space-y-2">
        <Text variant="body" className="font-medium text-gray-900 dark:text-white">
          Цена (руб.) <span className="text-red-500">*</span>
        </Text>
        <Input
          type="number"
          value={formData.pricePair || ''}
          onChange={e => {
            const value = parseFloat(e.target.value) || 0;
            onFieldChange('pricePair', value);
            onClearError('pricePair');
          }}
          placeholder="0"
          disabled={isSubmitting}
          required
          min="0"
          step="0.01"
          fullWidth
          className={errors.pricePair ? 'border-red-500' : ''}
        />
        {errors.pricePair && (
          <Text variant="caption" className="text-red-500">
            {errors.pricePair}
          </Text>
        )}
      </div>
    </>
  );
}

