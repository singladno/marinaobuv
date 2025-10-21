import CategoryTreeClient from './CategoryTreeClient';
import type { CatalogTreeNode as CategoryTreeNode } from '@/types/catalog-tree';

export function CategoryTree({
  tree,
  activePath,
}: {
  tree: CategoryTreeNode[];
  activePath?: string;
}) {
  return <CategoryTreeClient tree={tree} activePath={activePath} />;
}

export default CategoryTree;
