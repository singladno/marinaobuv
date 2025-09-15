export type Draft = {
  id: string;
  name: string;
  article: string | null;
  pricePair: number | null; // kopecks
  currency: string;
  packPairs: number | null;
  priceBox: number | null; // kopecks
  material: string | null;
  gender: string | null;
  season: string | null;
  description: string | null;
  status: string;
  images: { id: string; url: string; isPrimary: boolean; sort: number }[];
  messageId?: string;
  providerId?: string;
  provider?: { id: string; name: string; phone: string | null } | null;
  sizes?: Array<{ size: string; stock?: number; count?: number }> | null;
  createdAt?: string;
  updatedAt?: string;
};
