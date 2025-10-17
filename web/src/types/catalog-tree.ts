export type CatalogTreeNode = {
  id: string;
  name: string;
  slug: string;
  path: string; // obuv/...
  children: CatalogTreeNode[];
};
