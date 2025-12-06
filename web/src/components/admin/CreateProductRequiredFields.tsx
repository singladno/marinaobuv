'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import {
  CategorySelector,
  type CategoryNode,
} from '@/components/ui/CategorySelector';
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
  // Local state for buyPrice input to allow free typing
  const [buyPriceInput, setBuyPriceInput] = useState<string>(
    formData.buyPrice ? String(formData.buyPrice) : ''
  );
  const isUserInputtingRef = useRef(false);

  // Calculate markup percentage from buyPrice and pricePair
  const calculatedMarkup = useMemo(() => {
    if (!formData.buyPrice || formData.buyPrice <= 0) {
      return 30; // Default to 30% if no buyPrice
    }
    if (!formData.pricePair || formData.pricePair <= 0) {
      return 30; // Default to 30% if no pricePair
    }
    return (
      Math.round(
        ((formData.pricePair - formData.buyPrice) / formData.buyPrice) *
          100 *
          100
      ) / 100
    ); // Round to 2 decimal places
  }, [formData.buyPrice, formData.pricePair]);

  // Local state for markup input to allow free typing
  const [markupInput, setMarkupInput] = useState<string>(
    calculatedMarkup ? String(calculatedMarkup) : '30'
  );
  const isUserInputtingMarkupRef = useRef(false);

  // Sync local state with formData when it changes externally (e.g., from AG parsing)
  useEffect(() => {
    // Don't sync if user is currently typing
    if (isUserInputtingRef.current) {
      return;
    }

    if (formData.buyPrice !== null && formData.buyPrice !== undefined) {
      const newValue = String(formData.buyPrice);
      setBuyPriceInput(newValue);
    } else if (formData.buyPrice === null && buyPriceInput !== '') {
      setBuyPriceInput('');
    }
  }, [formData.buyPrice, buyPriceInput]);

  // Sync markup input with calculated markup when it changes externally
  useEffect(() => {
    // Don't sync if user is currently typing
    if (isUserInputtingMarkupRef.current) {
      return;
    }

    const newValue = String(calculatedMarkup);
    if (newValue !== markupInput) {
      setMarkupInput(newValue);
    }
  }, [calculatedMarkup, markupInput]);

  const handleMarkupInputChange = (value: string) => {
    isUserInputtingMarkupRef.current = true;
    setMarkupInput(value);

    // Parse the value
    const parsedValue =
      value === '' ? 30 : value === '.' ? 30 : parseFloat(value);

    // Always recalculate pricePair if buyPrice is set and markup is valid
    // Check both formData.buyPrice and buyPriceInput to handle cases where user is typing
    const currentBuyPrice =
      formData.buyPrice || (buyPriceInput ? parseFloat(buyPriceInput) : null);

    if (
      currentBuyPrice &&
      currentBuyPrice > 0 &&
      parsedValue !== null &&
      !isNaN(parsedValue) &&
      parsedValue >= 0
    ) {
      const newPricePair = currentBuyPrice * (1 + parsedValue / 100);
      onFieldChange('pricePair', Math.round(newPricePair * 100) / 100);
    }

    // Reset flag after a short delay to allow formData to update
    setTimeout(() => {
      isUserInputtingMarkupRef.current = false;
    }, 100);
  };

  const handleBuyPriceInputChange = (value: string) => {
    isUserInputtingRef.current = true;
    setBuyPriceInput(value);

    // Parse the value
    const parsedValue =
      value === '' ? null : value === '.' ? null : parseFloat(value);

    // Update formData with parsed value (or null if empty/invalid)
    const finalValue =
      parsedValue !== null && !isNaN(parsedValue) && parsedValue >= 0
        ? parsedValue
        : null;
    onFieldChange('buyPrice', finalValue);
    onClearError('buyPrice');

    // If buyPrice is set, recalculate pricePair using current markup (or default 30%)
    if (finalValue && finalValue > 0) {
      // Use markupInput if it's valid, otherwise try to calculate from existing values, or default to 30%
      const markupValue = parseFloat(markupInput);
      const currentMarkup =
        !isNaN(markupValue) && markupValue >= 0
          ? markupValue
          : formData.buyPrice &&
              formData.buyPrice > 0 &&
              formData.pricePair &&
              formData.pricePair > 0
            ? ((formData.pricePair - formData.buyPrice) / formData.buyPrice) *
              100
            : 30;
      const newPricePair = finalValue * (1 + currentMarkup / 100);
      onFieldChange('pricePair', Math.round(newPricePair * 100) / 100);
    }

    // Reset flag after a short delay to allow formData to update
    setTimeout(() => {
      isUserInputtingRef.current = false;
    }, 100);
  };
  return (
    <>
      {/* Name - Required */}
      <div className="space-y-2">
        <Text
          variant="body"
          className="font-medium text-gray-900 dark:text-white"
        >
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
        <Text
          variant="body"
          className="font-medium text-gray-900 dark:text-white"
        >
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

      {/* Buy Price and Markup - Optional */}
      <div className="space-y-2">
        <div className="flex gap-4">
          <div className="flex-1">
            <Text
              variant="body"
              className="font-medium text-gray-900 dark:text-white"
            >
              Закупочная цена (руб.)
            </Text>
            <Input
              type="number"
              value={buyPriceInput}
              onChange={e => {
                handleBuyPriceInputChange(e.target.value);
              }}
              placeholder="0"
              disabled={isSubmitting}
              min="0"
              step="0.01"
              fullWidth
              className={errors.buyPrice ? 'border-red-500' : ''}
            />
            {errors.buyPrice && (
              <Text variant="caption" className="text-red-500">
                {errors.buyPrice}
              </Text>
            )}
          </div>
          <div className="w-32">
            <Text
              variant="body"
              className="font-medium text-gray-900 dark:text-white"
            >
              Наценка (%)
            </Text>
            <Input
              type="number"
              value={markupInput}
              onChange={e => {
                handleMarkupInputChange(e.target.value);
              }}
              placeholder="30"
              disabled={isSubmitting}
              min="0"
              step="0.01"
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Price - Required */}
      <div className="space-y-2">
        <Text
          variant="body"
          className="font-medium text-gray-900 dark:text-white"
        >
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
