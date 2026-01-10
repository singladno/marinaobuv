export type AdminCategoryNode = {
  id: string;
  name: string;
  slug: string;
  path: string;
  parentId: string | null;
  sort: number;
  isActive: boolean;
  icon?: string | null;
  urlPath: string;
  segment: string;
  directProductCount: number;
  totalProductCount: number;
  seoCanonical?: string | null;
  seoDescription?: string | null;
  seoH1?: string | null;
  seoIntroHtml?: string | null;
  seoNoindex?: boolean;
  seoTitle?: string | null;
  seoUpdatedAt?: string | Date | null;
  children: AdminCategoryNode[];
};

export type FlatAdminCategory = AdminCategoryNode & {
  depth: number;
};
