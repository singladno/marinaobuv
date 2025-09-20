'use client';

import { useState } from 'react';

import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

export interface Product {
  id: string;
  slug: string;
  name: string;
  pricePair: number;
  currency: string;
  imageUrl: string | null;
  category?: string;
}

interface ProductGridProps {
  products: Product[];
  title?: string;
  showCategories?: boolean;
  categories?: string[];
  onCategoryChange?: (category: string) => void;
  selectedCategory?: string;
}

export default function ProductGrid({
  products,
  title = 'Товары',
  showCategories = true,
  categories = [],
  onCategoryChange,
  selectedCategory = 'Все',
}: ProductGridProps) {
  const [localSelectedCategory, setLocalSelectedCategory] =
    useState(selectedCategory);

  // Get unique categories from products if not provided
  const availableCategories =
    categories.length > 0
      ? categories
      : [
          'Все',
          ...Array.from(new Set(products.map(p => p.category).filter(Boolean))),
        ];

  // Filter products by category
  const filteredProducts =
    localSelectedCategory === 'Все'
      ? products
      : products.filter(p => p.category === localSelectedCategory);

  const handleCategoryChange = (category: string) => {
    setLocalSelectedCategory(category);
    onCategoryChange?.(category);
  };

  return (
    <div className="space-y-6">
      {/* Category Filters */}
      {showCategories && availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {availableCategories.map(category => (
            <Button
              key={category}
              variant={
                localSelectedCategory === category ? 'primary' : 'outline'
              }
              size="sm"
              onClick={() => handleCategoryChange(category)}
              className="transition-all duration-200 hover:scale-105"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            slug={product.slug}
            name={product.name}
            pricePair={product.pricePair}
            currency={product.currency}
            imageUrl={product.imageUrl}
            category={product.category}
            showCategory={showCategories}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto max-w-md">
            <div className="mb-4 text-5xl">🔍</div>
            <Text variant="h3" as="h3" className="mb-2 text-lg font-semibold">
              Товары не найдены
            </Text>
            <Text className="text-muted-foreground">
              В категории "{localSelectedCategory}" пока нет товаров
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
