import { prisma } from '@/lib/server/db';

import { draftSelect } from './draft-selectors';

interface DraftFilters {
  take: number;
  skip: number;
  status?: string;
}

export async function getDrafts(filters: DraftFilters) {
  const where =
    filters.status === 'deleted'
      ? { isDeleted: true }
      : filters.status === 'approved'
        ? { isDeleted: false }
        : { status: filters.status as string | undefined, isDeleted: false };

  const [drafts, total] = await Promise.all([
    prisma.waDraftProduct.findMany({
      take: filters.take,
      skip: filters.skip,
      where,
      orderBy: { createdAt: 'desc' },
      select: draftSelect,
    }),
    prisma.waDraftProduct.count({ where }),
  ]);

  return { drafts, total };
}

export async function getDraftById(id: string) {
  return prisma.waDraftProduct.findUnique({
    where: { id },
    select: draftSelect,
  });
}
