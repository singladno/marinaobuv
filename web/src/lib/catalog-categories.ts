import { prisma } from './db-node';

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  path: string; // stored as obuv/...
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

  const dbPath = `obuv/${path}`;
  return await prisma.category.findFirst({
    where: { path: dbPath, isActive: true },
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
