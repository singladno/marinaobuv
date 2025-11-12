'use client';

import { Input } from '@/components/ui/Input';
import { ProductSizesCell } from '@/components/features/ProductSizesCell';
import { Text } from '@/components/ui/Text';

import type { CreateProductData } from './CreateProductModal';
import { CreateProductGenderSeasonFields } from './CreateProductGenderSeasonFields';
import { MaterialAutocomplete } from './MaterialAutocomplete';

interface CreateProductOptionalFieldsProps {
  formData: Partial<CreateProductData>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onFieldChange: (field: keyof CreateProductData, value: any) => void;
  onClearError: (field: string) => void;
}

export function CreateProductOptionalFields({
  formData,
  errors,
  isSubmitting,
  onFieldChange,
  onClearError,
}: CreateProductOptionalFieldsProps) {
  return (
    <>
      {/* Material - Required */}
      <div className="space-y-2">
        <Text variant="body" className="font-medium text-gray-900 dark:text-white">
          Материал <span className="text-red-500">*</span>
        </Text>
        <MaterialAutocomplete
          value={formData.material || ''}
          onChange={value => {
            onFieldChange('material', value);
            onClearError('material');
          }}
          onClearError={() => onClearError('material')}
          disabled={isSubmitting}
          error={errors.material}
          required
        />
      </div>

      {/* Gender and Season - Required */}
      <CreateProductGenderSeasonFields
        formData={formData}
        errors={errors}
        isSubmitting={isSubmitting}
        onFieldChange={onFieldChange}
        onClearError={onClearError}
      />

      {/* Description - Required */}
      <div className="space-y-2">
        <Text variant="body" className="font-medium text-gray-900 dark:text-white">
          Описание <span className="text-red-500">*</span>
        </Text>
        <textarea
          value={formData.description || ''}
          onChange={e => {
            onFieldChange('description', e.target.value);
            onClearError('description');
          }}
          placeholder="Описание товара"
          disabled={isSubmitting}
          required
          rows={4}
          className={`w-full rounded-lg border border-gray-200 bg-background px-3 py-2 text-sm shadow-none outline-none placeholder:text-muted focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:ring-offset-0 dark:border-gray-600 ${
            errors.description ? 'border-red-500' : ''
          }`}
        />
        {errors.description && (
          <Text variant="caption" className="text-red-500">
            {errors.description}
          </Text>
        )}
      </div>

      {/* Sizes - Required */}
      <div className="space-y-2">
        <Text variant="body" className="font-medium text-gray-900 dark:text-white">
          Размеры <span className="text-red-500">*</span>
        </Text>
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-600">
          <ProductSizesCell
            sizes={formData.sizes || []}
            onChange={sizes => {
              onFieldChange('sizes', sizes);
              onClearError('sizes');
            }}
            disabled={isSubmitting}
          />
        </div>
        {errors.sizes && (
          <Text variant="caption" className="text-red-500">
            {errors.sizes}
          </Text>
        )}
      </div>
    </>
  );
}

