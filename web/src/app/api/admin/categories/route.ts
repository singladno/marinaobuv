import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { slugify } from '@/utils/slugify';

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  path: string;
  parentId: string | null;
  sort: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  seoCanonical: string | null;
  seoDescription: string | null;
  seoH1: string | null;
  seoIntroHtml: string | null;
  seoNoindex: boolean;
  seoTitle: string | null;
  seoUpdatedAt: Date | null;
};

type TreeNode = CategoryRecord & {
  urlPath: string;
  segment: string;
  directProductCount: number;
  totalProductCount: number;
  children: TreeNode[];
};

const urlPath = (path: string) => path.replace(/^obuv\/?/, '');
const lastSegment = (path: string) => path.split('/').pop() || '';

const capitalizeFirstLetter = (str: string): string => {
  if (!str.trim()) return str;
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const buildTree = (
  categories: CategoryRecord[],
  counts: Map<string, number>
): TreeNode[] => {
  const childrenByParent = new Map<string | null, CategoryRecord[]>();
  categories.forEach(category => {
    const bucket = childrenByParent.get(category.parentId) ?? [];
    bucket.push(category);
    childrenByParent.set(category.parentId, bucket);
  });

  const toNode = (category: CategoryRecord): TreeNode => {
    const children =
      childrenByParent
        .get(category.id)
        ?.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
        .map(toNode) ?? [];
    const directProductCount = counts.get(category.id) ?? 0;
    const totalProductCount =
      directProductCount +
      children.reduce((acc, child) => acc + child.totalProductCount, 0);

    return {
      ...category,
      urlPath: urlPath(category.path),
      segment: lastSegment(category.path),
      directProductCount,
      totalProductCount,
      children,
    };
  };

  const roots =
    childrenByParent.get(null)?.sort((a, b) => a.sort - b.sort) ?? [];
  return roots.map(toNode);
};

const sanitizeSegment = (value?: string | null) => {
  const fallback = slugify(value ?? '');
  return fallback || '';
};

const sanitizeSlug = (
  parentSlug: string | null,
  candidate?: string | null,
  fallbackName?: string | null
) => {
  const baseCandidate =
    candidate ||
    [
      parentSlug?.replace(/-+/g, '-').replace(/^-|-$/g, ''),
      slugify(fallbackName ?? ''),
    ]
      .filter(Boolean)
      .join('-');

  const sanitized = slugify(baseCandidate || '');
  return sanitized || 'category';
};

const ensureUniqueSlug = async (base: string) => {
  let slug = base || 'category';
  let suffix = 1;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;

    slug = `${base}-${suffix}`;
    suffix += 1;

    if (suffix > 100) {
      throw new Error('Не удалось подобрать уникальный slug');
    }
  }
};

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  try {
    const [categories, productGroups] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.product.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
      }),
    ]);

    const productCounts = new Map<string, number>(
      productGroups.map(group => [
        group.categoryId,
        Number(group._count._all) || 0,
      ])
    );

    const tree = buildTree(categories, productCounts);
    return NextResponse.json({ ok: true, items: tree });
  } catch (error) {
    console.error('[admin/categories][GET] Failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Не удалось загрузить категории' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      name,
      parentId,
      urlSegment,
      slug: slugInput,
      isActive = true,
      seoTitle,
      seoDescription,
      seoH1,
      seoCanonical,
      seoIntroHtml,
      seoNoindex = false,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Название категории обязательно' },
        { status: 400 }
      );
    }

    const segment = sanitizeSegment(urlSegment || name);
    if (!segment) {
      return NextResponse.json(
        { ok: false, error: 'URL сегмент обязателен' },
        { status: 400 }
      );
    }

    let path: string;
    let slug: string;

    if (parentId) {
      // Creating a subcategory
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      return NextResponse.json(
        { ok: false, error: 'Родительская категория не найдена' },
        { status: 404 }
      );
    }
      path = `${parent.path}/${segment}`;
      const slugBase = sanitizeSlug(parent.slug, slugInput, name);
      slug = await ensureUniqueSlug(slugBase);
    } else {
      // Creating a root category
      path = segment;
      const slugBase = sanitizeSlug(null, slugInput, name);
      slug = await ensureUniqueSlug(slugBase);
    }

    // Calculate sort value to add category at the end
    // Find the max sort value for categories with the same parent
    const maxSort = await prisma.category.findFirst({
      where: { parentId: parentId || null },
      orderBy: { sort: 'desc' },
      select: { sort: true },
    });
    const sortValue = maxSort ? maxSort.sort + 1 : 500;

    const newCategory = await prisma.category.create({
      data: {
        name: capitalizeFirstLetter(name),
        parentId,
        slug,
        path,
        sort: sortValue,
        isActive: Boolean(isActive),
        seoTitle,
        seoDescription,
        seoH1,
        seoCanonical,
        seoIntroHtml,
        seoNoindex: Boolean(seoNoindex),
      },
    });

    return NextResponse.json({
      ok: true,
      item: {
        ...newCategory,
        urlPath: urlPath(newCategory.path),
        segment: lastSegment(newCategory.path),
        directProductCount: 0,
        totalProductCount: 0,
        children: [],
      },
    });
  } catch (error: any) {
    console.error('[admin/categories][POST] Failed:', error);

    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.includes('slug')
        ? 'slug'
        : 'URL сегмент';
      return NextResponse.json(
        {
          ok: false,
          error: `Категория с таким ${field} уже существует`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Не удалось создать категорию' },
      { status: 500 }
    );
  }
}
