import type { CategoryNode } from '@/components/ui/CategorySelector';

/**
 * Filter categories to only include leaf nodes (categories without children)
 */
export function getLeafCategories(categories: CategoryNode[]): CategoryNode[] {
  const leafCategories: CategoryNode[] = [];

  const traverse = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      if (!node.children || node.children.length === 0) {
        // This is a leaf category
        leafCategories.push({
          id: node.id,
          name: node.name,
          slug: node.slug,
          path: node.path,
        });
      } else {
        // Has children, traverse deeper
        traverse(node.children);
      }
    }
  };

  traverse(categories);
  return leafCategories;
}

/**
 * Filter category tree to only show leaf nodes as selectable
 * Non-leaf nodes are kept for navigation but cannot be selected
 */
export function filterCategoryTreeForLeaves(
  categories: CategoryNode[]
): CategoryNode[] {
  return categories.map(category => {
    if (!category.children || category.children.length === 0) {
      // Leaf node - keep as is
      return category;
    } else {
      // Non-leaf node - keep structure but mark children
      return {
        ...category,
        children: filterCategoryTreeForLeaves(category.children),
      };
    }
  });
}
