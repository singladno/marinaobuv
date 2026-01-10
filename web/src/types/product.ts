export interface Product {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  categoryId: string;
  pricePair: number; // in rubles
  buyPrice: number | null; // закупочная цена (purchase price)
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
  videos?: ProductVideo[];
  sizes: Array<{ size: string; count: number }>; // Array of size objects like [{size: '36', count: 1}, {size: '38', count: 2}]
  sourceMessageIds: string[] | null; // Array of WhatsApp message IDs that created this product
  sourceScreenshotUrl: string | null; // URL of source screenshot for MANUAL products
  sourceScreenshotKey: string | null; // S3 key of source screenshot for MANUAL products
  source: 'WA' | 'AG' | 'MANUAL'; // Source of the product: WA (WhatsApp), AG (aggregator), or MANUAL (manually created)
  measurementUnit: 'PAIRS' | 'PIECES'; // Unit of measurement: PAIRS (пары) or PIECES (штуки)
  gptRequest: string | null; // GPT request for debugging
  gptResponse: string | null; // GPT response for debugging
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

export interface ProductVideo {
  id: string;
  url: string;
  alt: string | null;
  sort: number;
  duration?: number | null;
  isActive: boolean;
}

export interface ProductUpdateData {
  name?: string;
  article?: string | null;
  categoryId?: string;
  pricePair?: number; // in rubles
  buyPrice?: number | null; // закупочная цена (purchase price)
  currency?: string;
  material?: string | null;
  gender?: 'FEMALE' | 'MALE' | null;
  season?: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | null;
  description?: string | null;
  isActive?: boolean;
  sizes?: Array<{ size: string; count: number }>;
  providerId?: string | null;
  measurementUnit?: 'PAIRS' | 'PIECES';
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
