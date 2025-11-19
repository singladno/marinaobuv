import { prisma } from './db-node';

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  path: string; // Full category path (e.g., "odezhda", "odezhda/muzhskaya-odezhda", "obuv", "obuv/womens")
  children: CategoryNode[];
};

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const roots = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sort: 'asc' },
  });

  return Promise.all(
    roots.map(async root => {
      const children = await getCategoryChildren(root.id);
      return {
        id: root.id,
        name: root.name,
        slug: root.slug,
        path: root.path,
        children,
      };
    })
  );
}

async function getCategoryChildren(parentId: string): Promise<CategoryNode[]> {
  const children = await prisma.category.findMany({
    where: { parentId, isActive: true },
    orderBy: { sort: 'asc' },
  });

  return Promise.all(
    children.map(async child => {
      const grandChildren = await getCategoryChildren(child.id);
      return {
        id: child.id,
        name: child.name,
        slug: child.slug,
        path: child.path,
        children: grandChildren,
      };
    })
  );
}

export async function getCategoryByPath(path?: string) {
  if (!path) return null;

  // Match path directly, no hardcoded prefix - categories are stored with their full path
  return await prisma.category.findFirst({
    where: { path: path, isActive: true },
  });
}

export async function getCategoryById(id: string) {
  return await prisma.category.findUnique({
    where: { id, isActive: true },
  });
}

export async function getAllCategories() {
  return await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sort: 'asc' },
  });
}

/**
 * Get only leaf categories (categories without children) from the tree
 * This is useful for reducing token usage in category analysis
 */
export function getLeafCategories(categories: CategoryNode[]): Array<{
  id: string;
  name: string;
  slug: string;
  path: string;
}> {
  const leafCategories: Array<{
    id: string;
    name: string;
    slug: string;
    path: string;
  }> = [];

  const traverse = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      if (node.children.length === 0) {
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
