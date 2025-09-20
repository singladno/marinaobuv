export interface Product {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  categoryId: string;
  pricePair: number; // in kopecks
  currency: string;
  packPairs: number | null;
  priceBox: number | null;
  material: string | null;
  gender: 'FEMALE' | 'MALE' | 'UNISEX' | null;
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | null;
  description: string | null;
  availabilityCheckedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    path: string;
  };
  images: ProductImage[];
  sizes: ProductSize[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

export interface ProductSize {
  id: string;
  size: string;
  stock: number | null;
  sku: string | null;
}

export interface ProductUpdateData {
  name?: string;
  article?: string | null;
  categoryId?: string;
  pricePair?: number; // in rubles for frontend
  currency?: string;
  packPairs?: number | null;
  priceBox?: number | null;
  material?: string | null;
  gender?: 'FEMALE' | 'MALE' | 'UNISEX' | null;
  season?: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | null;
  description?: string | null;
  isActive?: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductsFilters {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}
