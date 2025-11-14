import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getProductById, getProducts } from './product-service';
import { productInclude } from './product-includes';
import { slugify } from '@/utils/slugify';
import { generateArticleNumber } from '@/lib/services/product-creation-mappers';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const { products, pagination } = await getProducts({
      page,
      pageSize,
      search,
      categoryId,
    });

    return NextResponse.json({ products, pagination });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();
    const {
      name,
      categoryId,
      pricePair,
      material,
      gender,
      season,
      description,
      sizes,
      currency = 'RUB',
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Название товара обязательно' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Категория обязательна' },
        { status: 400 }
      );
    }

    if (pricePair === undefined || pricePair === null) {
      return NextResponse.json(
        { error: 'Цена обязательна' },
        { status: 400 }
      );
    }

    if (!material || !material.trim()) {
      return NextResponse.json(
        { error: 'Материал обязателен' },
        { status: 400 }
      );
    }

    if (!gender) {
      return NextResponse.json(
        { error: 'Пол обязателен' },
        { status: 400 }
      );
    }

    if (!season) {
      return NextResponse.json(
        { error: 'Сезон обязателен' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Описание обязательно' },
        { status: 400 }
      );
    }

    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
      return NextResponse.json(
        { error: 'Укажите хотя бы один размер' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(name);

    // If slug is empty (e.g., only special characters), use a fallback
    if (!baseSlug) {
      baseSlug = 'product';
    }

    let slug = baseSlug;
    let counter = 1;

    // Ensure slug uniqueness
    while (true) {
      const existing = await prisma.product.findUnique({
        where: { slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 1000) {
        // Fallback to timestamp-based slug
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }

    // Generate article number
    const article = generateArticleNumber();

    // Create product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug,
        article,
        categoryId,
        pricePair: parseFloat(pricePair),
        currency,
        material: material.trim(),
        gender: gender,
        season: season,
        description: description.trim(),
        sizes: sizes,
        isActive,
        source: 'AG', // Admin-created products
        activeUpdatedAt: new Date(),
      },
      include: productInclude,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);

    // Handle Prisma unique constraint errors
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Товар с таким slug уже существует' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Не удалось создать товар' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();
    const { id, ...rawUpdateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Требуется ID товара' },
        { status: 400 }
      );
    }

    // Validate that at least one field is being updated
    if (Object.keys(rawUpdateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Whitelist updatable scalar fields to avoid Prisma validation errors
    const allowedScalarKeys: (keyof typeof rawUpdateData)[] = [
      'slug',
      'name',
      'article',
      'pricePair',
      'currency',
      'material',
      'gender',
      'season',
      'description',
      'availabilityCheckedAt',
      'isActive',
      'sizes',
      'sourceMessageIds',
      'analysisBatchId',
      'colorBatchId',
      'batchProcessingStatus',
      'gptRequest',
      'gptResponse',
    ] as any;

    const updateData: Record<string, unknown> = {};
    for (const key of allowedScalarKeys) {
      if (key in rawUpdateData) {
        updateData[key as string] = (rawUpdateData as any)[key];
      }
    }

    // Debug: Log sizes if present
    if ('sizes' in rawUpdateData) {
      console.log('[PATCH /api/admin/products] Updating sizes:', JSON.stringify(rawUpdateData.sizes));
      console.log('[PATCH /api/admin/products] Sizes type:', typeof rawUpdateData.sizes, Array.isArray(rawUpdateData.sizes));
    }

    // Map relation IDs to relation updates if present
    if ('categoryId' in rawUpdateData && rawUpdateData.categoryId) {
      updateData.category = { connect: { id: rawUpdateData.categoryId } };
    }
    if ('providerId' in rawUpdateData && rawUpdateData.providerId) {
      updateData.provider = { connect: { id: rawUpdateData.providerId } };
    }

    // Always bump activeUpdatedAt for any update
    updateData.activeUpdatedAt = new Date();

    // Debug: Log final updateData
    if ('sizes' in updateData) {
      console.log('[PATCH /api/admin/products] Final updateData.sizes:', JSON.stringify(updateData.sizes));
      console.log('[PATCH /api/admin/products] updateData keys:', Object.keys(updateData));
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: productInclude,
    });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Требуется ID товара' },
        { status: 400 }
      );
    }

    // Prevent deletion if product is referenced in orders
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });
    if (orderItemCount > 0) {
      return NextResponse.json(
        {
          error:
            'Нельзя удалить товар: он уже используется в заказах. Сначала удалите связанные позиции заказов или пометьте товар как неактивный.',
        },
        { status: 400 }
      );
    }

    // Delete the product (images are cascaded via schema)
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
