export interface Product {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  categoryId: string;
  pricePair: number; // in rubles
  currency: string;
  material: string | null;
  gender: 'FEMALE' | 'MALE' | null;
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | null;
  description: string | null;
  availabilityCheckedAt: Date | null;
  activeUpdatedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  providerId: string | null;
  category: {
    id: string;
    name: string;
    path: string;
  };
  provider: {
    id: string;
    name: string;
    phone: string | null;
    place: string | null;
  } | null;
  images: ProductImage[];
  sizes: Array<{ size: string; count: number }>; // Array of size objects like [{size: '36', count: 1}, {size: '38', count: 2}]
  sourceMessageIds: string[] | null; // Array of WhatsApp message IDs that created this product
  source: 'WA' | 'AG' | 'MANUAL'; // Source of the product: WA (WhatsApp), AG (aggregator), or MANUAL (manually created)
  gptRequest: string | null; // GPT request for debugging
  gptResponse: string | null; // GPT response for debugging
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

export interface ProductUpdateData {
  name?: string;
  article?: string | null;
  categoryId?: string;
  pricePair?: number; // in rubles
  currency?: string;
  material?: string | null;
  gender?: 'FEMALE' | 'MALE' | null;
  season?: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | null;
  description?: string | null;
  isActive?: boolean;
  sizes?: Array<{ size: string; count: number }>;
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
