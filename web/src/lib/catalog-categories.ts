import type { Prisma } from '@prisma/client';

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
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sort: 'asc' },
      },
    },
  });

  return roots.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    path: r.path,
    children: r.children.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      path: c.path,
      children: [],
    })),
  }));
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
