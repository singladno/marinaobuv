interface Product {
  id: string;
  name: string;
  article?: string | null;
  pricePair: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
  reviews?: Array<{
    rating: number;
  }>;
  sizes?: Array<{
    stock: number;
  }>;
  colorOptions?: Array<{
    color: string;
    imageUrl: string;
  }>;
}

// Helper functions for filtering
export const matchesSearchQuery = (product: Product, query: string) => {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return (
    product.name.toLowerCase().includes(lowerQuery) ||
    product.article?.toLowerCase()?.includes(lowerQuery) ||
    product.category?.name?.toLowerCase()?.includes(lowerQuery)
  );
};

export const matchesCategoryFilter = (
  product: Product,
  categories: string[]
) => {
  if (categories.length === 0) return true;
  return product.category && categories.includes(product.category.id);
};

export const matchesPriceRange = (
  product: Product,
  priceRange: [number, number]
) => {
  return (
    product.pricePair >= priceRange[0] && product.pricePair <= priceRange[1]
  );
};

export const matchesRatingFilter = (product: Product, minRating: number) => {
  if (minRating === 0) return true;
  const avgRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce(
          (sum: number, review: { rating: number }) => sum + review.rating,
          0
        ) / product.reviews.length
      : 0;
  return avgRating >= minRating;
};

export const matchesStockFilter = (product: Product, inStock: boolean) => {
  if (!inStock) return true;
  return (
    product.sizes?.some((size: { stock: number }) => size.stock > 0) || false
  );
};

export const matchesColorFilter = (product: Product, colors: string[]) => {
  if (colors.length === 0) return true;
  if (!product.colorOptions || product.colorOptions.length === 0) return false;

  const productColors = product.colorOptions.map(option =>
    option.color.toLowerCase()
  );
  return colors.some(selectedColor =>
    productColors.includes(selectedColor.toLowerCase())
  );
};
