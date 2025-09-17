export type Draft = {
  id: string;
  name: string | null;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    path: string;
  } | null;
  pricePair: number | null; // kopecks
  currency: string;
  packPairs: number | null;
  priceBox: number | null; // kopecks
  material: string | null;
  gender: string | null;
  season: string | null;
  description: string | null;
  providerDiscount: number | null; // kopecks
  status: string;
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
  sizes?: Array<{ size: string; stock?: number; count?: number }> | null;
  gptRequest?: string | null;
  rawGptResponse?: any;
  gptRequest2?: string | null;
  rawGptResponse2?: any;
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
