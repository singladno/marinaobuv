'use client';

import type { CategoryNode } from '@/components/ui/CategorySelector';

import type { CreateProductData } from './CreateProductModal';
import { CreateProductRequiredFields } from './CreateProductRequiredFields';
import { CreateProductOptionalFields } from './CreateProductOptionalFields';

interface CreateProductFormFieldsProps {
  formData: Partial<CreateProductData>;
  errors: Record<string, string>;
  categories: CategoryNode[];
  isSubmitting: boolean;
  onFieldChange: (field: keyof CreateProductData, value: any) => void;
  onClearError: (field: string) => void;
  isEditMode?: boolean;
}

export function CreateProductFormFields({
  formData,
  errors,
  categories,
  isSubmitting,
  onFieldChange,
  onClearError,
  isEditMode = false,
}: CreateProductFormFieldsProps) {
  return (
    <>
      <CreateProductRequiredFields
        formData={formData}
        errors={errors}
        categories={categories}
        isSubmitting={isSubmitting}
        onFieldChange={onFieldChange}
        onClearError={onClearError}
      />
      <CreateProductOptionalFields
        formData={formData}
        errors={errors}
        isSubmitting={isSubmitting}
        onFieldChange={onFieldChange}
        onClearError={onClearError}
        isEditMode={isEditMode}
      />
    </>
  );
}
