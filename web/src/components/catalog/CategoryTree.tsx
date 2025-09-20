import CategoryTreeClient, {
  type CategoryTreeNode,
} from './CategoryTreeClient';

export type { CategoryTreeNode };

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
