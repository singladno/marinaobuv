import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { slugify } from '@/utils/slugify';

const urlPath = (path: string) => path.replace(/^obuv\/?/, '');
const lastSegment = (path: string) => path.split('/').pop() || '';

const capitalizeFirstLetter = (str: string): string => {
  if (!str.trim()) return str;
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
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

const ensureUniqueSlug = async (base: string, excludeId?: string) => {
  let slug = base || 'category';
  let suffix = 1;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;

    slug = `${base}-${suffix}`;
    suffix += 1;

    if (suffix > 100) {
      throw new Error('Не удалось подобрать уникальный slug');
    }
  }
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  try {
    const { id: categoryId } = await params;
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

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!existingCategory) {
      return NextResponse.json(
        { ok: false, error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Название категории обязательно' },
        { status: 400 }
      );
    }

    // Prevent setting category as its own parent
    if (parentId && parentId === categoryId) {
      return NextResponse.json(
        { ok: false, error: 'Категория не может быть родителем самой себя' },
        { status: 400 }
      );
    }

    let path: string;
    let slug: string;

    if (parentId) {
      // Updating to be a subcategory
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json(
          { ok: false, error: 'Родительская категория не найдена' },
          { status: 404 }
        );
      }

      // Prevent circular references - check if parent is a descendant
      const checkCircular = async (checkId: string): Promise<boolean> => {
        const children = await prisma.category.findMany({
          where: { parentId: checkId },
          select: { id: true },
        });
        for (const child of children) {
          if (child.id === parentId) return true;
          if (await checkCircular(child.id)) return true;
        }
        return false;
      };

      if (await checkCircular(categoryId)) {
        return NextResponse.json(
          { ok: false, error: 'Нельзя переместить категорию в её потомка' },
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
      path = `${parent.path}/${segment}`;
      const slugBase = sanitizeSlug(parent.slug, slugInput, name);
      slug = await ensureUniqueSlug(slugBase, categoryId);
    } else {
      // Updating to be a root category
      const segment = sanitizeSegment(urlSegment || name);
      if (!segment) {
        return NextResponse.json(
          { ok: false, error: 'URL сегмент обязателен' },
          { status: 400 }
        );
      }
      path = segment;
      const slugBase = sanitizeSlug(null, slugInput, name);
      slug = await ensureUniqueSlug(slugBase, categoryId);
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: capitalizeFirstLetter(name),
        parentId,
        slug,
        path,
        // Keep existing sort value when editing
        sort: existingCategory.sort,
        isActive: Boolean(isActive),
        seoTitle,
        seoDescription,
        seoH1,
        seoCanonical,
        seoIntroHtml,
        seoNoindex: Boolean(seoNoindex),
      },
    });

    // Calculate product counts
    const directProductCount = await prisma.product.count({
      where: { categoryId: categoryId },
    });

    return NextResponse.json({
      ok: true,
      item: {
        ...updatedCategory,
        urlPath: urlPath(updatedCategory.path),
        segment: lastSegment(updatedCategory.path),
        directProductCount,
        totalProductCount: directProductCount, // Simplified - full calculation would require tree traversal
        children: [],
      },
    });
  } catch (error: any) {
    console.error('[admin/categories][PATCH] Failed:', error);

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
      { ok: false, error: 'Не удалось обновить категорию' },
      { status: 500 }
    );
  }
}
