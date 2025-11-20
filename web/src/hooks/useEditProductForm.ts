import { useState, useEffect } from 'react';

import type { CreateProductData } from '@/components/admin/CreateProductModal';
import type { ImageFile } from '@/components/admin/CreateProductModal';

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

interface ProductData {
  id: string;
  name: string;
  categoryId: string;
  pricePair: number;
  material: string;
  gender: 'FEMALE' | 'MALE';
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  description: string;
  sizes: Array<{ size: string; count: number }>;
  sourceScreenshotUrl?: string | null;
  images?: Array<{
    id: string;
    url: string;
    color: string | null;
    isPrimary: boolean;
    isActive: boolean;
  }>;
}

export function useEditProductForm(productId: string | null) {
  const [formData, setFormData] =
    useState<Partial<CreateProductData>>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);

  // Load product data when productId changes
  useEffect(() => {
    if (!productId) {
      reset();
      return;
    }

    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/products/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const data = await response.json();
        const product: ProductData = data.product;

        // Set form data
        setFormData({
          name: product.name || '',
          categoryId: product.categoryId || '',
          pricePair: product.pricePair || 0,
          buyPrice: (product as any).buyPrice || null,
          material: product.material || '',
          gender: product.gender,
          season: product.season,
          description: product.description || '',
          sizes: product.sizes || [],
          providerId: (product as any).providerId || null,
        });

        // Convert existing images to ImageFile format
        if (product.images && product.images.length > 0) {
          const imageFiles: ImageFile[] = product.images.map((img: any) => ({
            file: new File([], ''), // Empty file for existing images
            preview: img.url,
            id: img.id,
            color: img.color || '',
            isPrimary: img.isPrimary || false,
            // Map isActive: false to isDeleted: true
            // Images that are disabled (isActive: false) should show as deleted in the UI
            isDeleted: !img.isActive,
          }));
          setImages(imageFiles);
        } else {
          setImages([]);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setErrors({ submit: 'Не удалось загрузить товар' });
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

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
    setImages([]);
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
    images,
    setImages,
    loading,
  };
}
