export type CatalogFilters = {
  sizes?: string[]; // e.g. ["36","37","38"]
  priceFrom?: number | null; // RUB
  priceTo?: number | null; // RUB
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'newest';
  page?: number;
  pageSize?: number;
};
