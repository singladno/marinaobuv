export interface FilterOptions {
  categories: string[];
  priceRange: [number, number];
  minRating: number;
  inStock: boolean;
  sortBy: string;
  colors: string[];
}

export interface CatalogFilters {
  sizes?: string[];
  priceFrom: number | null;
  priceTo: number | null;
  sort: 'relevance' | 'price-asc' | 'price-desc' | 'newest';
  page: number;
  pageSize: number;
}
