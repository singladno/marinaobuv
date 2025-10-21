export type DraftSize = {
  id: string;
  size: string;
  quantity: number;
  isActive: boolean;
};

export type Draft = {
  id: string;
  name: string | null;
  article: string | null;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    path: string;
  } | null;
  pricePair: number | null; // rubles
  currency: string;
  material: string | null;
  gender: string | null;
  season: string | null;
  description: string | null;
  providerDiscount: number | null; // rubles
  status: string;
  // Add missing properties
  packPairs?: number | null;
  priceBox?: number | null;
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
    sort: number;
    alt?: string | null;
    isFalseImage?: boolean;
    isActive?: boolean;
    color?: string | null;
  }[];
  messageId?: string;
  providerId?: string;
  provider?: {
    id: string;
    name: string;
    phone: string | null;
    place: string | null;
  } | null;
  sizes?: Array<{
    size: string;
    stock?: number;
    count?: number;
    quantity?: number;
  }> | null;
  gptRequest?: string | null;
  rawGptResponse?: string;
  gptRequest2?: string | null;
  rawGptResponse2?: string;
  aiStatus?: string | null;
  aiProcessedAt?: string | null;
  source?: Array<{
    id: string;
    waMessageId: string;
    from: string | null;
    fromName: string | null;
    type: string | null;
    text: string | null;
    timestamp: number | null;
    mediaUrl: string | null;
    mediaMimeType: string | null;
    mediaWidth: number | null;
    mediaHeight: number | null;
    createdAt: string;
    provider: {
      name: string;
    } | null;
  }> | null;
  createdAt?: string;
  updatedAt?: string;
};
