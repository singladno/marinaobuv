'use client';

import React, { useState } from 'react';

import { useCategories } from '@/hooks/useCategories';
import type { Product, ProductUpdateData } from '@/types/product';

import { EditableProductCell } from './EditableProductCell';

interface ProductTableRowProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
}

export function ProductTableRow({
  product,
  onUpdateProduct,
}: ProductTableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { categories } = useCategories();

  const handleSave = async (field: string, value: unknown) => {
    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, { [field]: value });
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (priceInKopecks: number) => {
    return (priceInKopecks / 100).toFixed(2);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const getGenderLabel = (gender: string | null) => {
    switch (gender) {
      case 'FEMALE':
        return 'Женский';
      case 'MALE':
        return 'Мужской';
      case 'UNISEX':
        return 'Унисекс';
      default:
        return '-';
    }
  };

  const getSeasonLabel = (season: string | null) => {
    switch (season) {
      case 'SPRING':
        return 'Весна';
      case 'SUMMER':
        return 'Лето';
      case 'AUTUMN':
        return 'Осень';
      case 'WINTER':
        return 'Зима';
      default:
        return '-';
    }
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      {/* Image */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        {product.images[0] ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
        )}
      </td>

      {/* Name */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <EditableProductCell
          value={product.name}
          onSave={value => handleSave('name', value)}
          isEditing={isEditing}
          onEdit={() => setIsEditing(!isEditing)}
          isSaving={isSaving}
          type="text"
          className="font-medium"
        />
      </td>

      {/* Article */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <EditableProductCell
          value={product.article || ''}
          onSave={value => handleSave('article', value || null)}
          isEditing={isEditing}
          onEdit={() => setIsEditing(!isEditing)}
          isSaving={isSaving}
          type="text"
        />
      </td>

      {/* Category */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <EditableProductCell
          value={product.category.name}
          onSave={value => {
            const category = categories.find(c => c.name === value);
            if (category) handleSave('categoryId', category.id);
          }}
          isEditing={isEditing}
          onEdit={() => setIsEditing(!isEditing)}
          isSaving={isSaving}
          type="select"
          options={categories.map(c => ({ value: c.name, label: c.name }))}
        />
      </td>

      {/* Price */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <EditableProductCell
          value={formatPrice(product.pricePair)}
          onSave={value => handleSave('pricePair', parseFloat(value) * 100)}
          isEditing={isEditing}
          onEdit={() => setIsEditing(!isEditing)}
          isSaving={isSaving}
          type="number"
          step="0.01"
        />
      </td>

      {/* Gender */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <EditableProductCell
          value={getGenderLabel(product.gender)}
          onSave={value => {
            const genderMap: Record<string, string | null> = {
              Женский: 'FEMALE',
              Мужской: 'MALE',
              Унисекс: 'UNISEX',
              '-': null,
            };
            handleSave('gender', genderMap[value] || null);
          }}
          isEditing={isEditing}
          onEdit={() => setIsEditing(!isEditing)}
          isSaving={isSaving}
          type="select"
          options={[
            { value: 'Женский', label: 'Женский' },
            { value: 'Мужской', label: 'Мужской' },
            { value: 'Унисекс', label: 'Унисекс' },
            { value: '-', label: '-' },
          ]}
        />
      </td>

      {/* Season */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <EditableProductCell
          value={getSeasonLabel(product.season)}
          onSave={value => {
            const seasonMap: Record<string, string | null> = {
              Весна: 'SPRING',
              Лето: 'SUMMER',
              Осень: 'AUTUMN',
              Зима: 'WINTER',
              '-': null,
            };
            handleSave('season', seasonMap[value] || null);
          }}
          isEditing={isEditing}
          onEdit={() => setIsEditing(!isEditing)}
          isSaving={isSaving}
          type="select"
          options={[
            { value: 'Весна', label: 'Весна' },
            { value: 'Лето', label: 'Лето' },
            { value: 'Осень', label: 'Осень' },
            { value: 'Зима', label: 'Зима' },
            { value: '-', label: '-' },
          ]}
        />
      </td>

      {/* Sizes */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="text-sm">
          {product.sizes.length > 0 ? (
            <span className="text-gray-600 dark:text-gray-400">
              {product.sizes.length} размеров
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </td>

      {/* Created */}
      <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        {formatDate(product.createdAt)}
      </td>

      {/* Actions */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isEditing ? 'Сохранить' : 'Редактировать'}
        </button>
      </td>
    </tr>
  );
}
