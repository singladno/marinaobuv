import { useState } from 'react';

import type { CreateProductData } from '@/components/admin/CreateProductModal';

const initialFormData: Partial<CreateProductData> = {
  name: '',
  categoryId: '',
  pricePair: 0,
  material: '',
  gender: undefined,
  season: undefined,
  description: '',
  sizes: [],
};

export function useCreateProductForm() {
  const [formData, setFormData] = useState<Partial<CreateProductData>>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Категория обязательна';
    }
    if (!formData.pricePair || formData.pricePair <= 0) {
      newErrors.pricePair = 'Цена должна быть больше 0';
    }
    if (!formData.material || !formData.material.trim()) {
      newErrors.material = 'Материал обязателен';
    }
    if (!formData.gender) {
      newErrors.gender = 'Пол обязателен';
    }
    if (!formData.season) {
      newErrors.season = 'Сезон обязателен';
    }
    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }
    if (!formData.sizes || formData.sizes.length === 0) {
      newErrors.sizes = 'Укажите хотя бы один размер';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const prepareSubmitData = (): CreateProductData => {
    if (
      !formData.name ||
      !formData.categoryId ||
      !formData.pricePair ||
      !formData.material ||
      !formData.gender ||
      !formData.season ||
      !formData.description ||
      !formData.sizes
    ) {
      throw new Error('All required fields must be filled');
    }

    return {
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      pricePair: formData.pricePair,
      material: formData.material.trim(),
      gender: formData.gender,
      season: formData.season,
      description: formData.description.trim(),
      sizes: formData.sizes,
    };
  };

  const reset = () => {
    setFormData(initialFormData);
    setErrors({});
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    validate,
    prepareSubmitData,
    reset,
    clearError,
  };
}
