export interface AnalysisResult {
  name: string;
  price: number;
  currency: string;
  gender: 'MALE' | 'FEMALE';
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  sizes: Array<{ size: string; count: number }>;
  colors: string[];
  imageColors?: Array<{ url: string; color: string | null }>;
  description?: string;
  material?: string;
  categoryId?: string | null;
  newCategory?: {
    name: string;
    slug: string;
    parentCategoryId: string;
  };
  packPairs?: number;
  providerDiscount?: number;
  providerPlace?: string;
}
