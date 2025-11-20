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
      buyPrice,
      material,
      gender,
      season,
      description,
      sizes,
      currency = 'RUB',
      isActive = true,
      providerId,
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

    // Validate sizes structure - size can be text (e.g., "35/36"), count must be a number
    for (const size of sizes) {
      if (!size.size || typeof size.size !== 'string' || size.size.trim() === '') {
        return NextResponse.json(
          { error: 'Каждый размер должен иметь текстовое значение размера (например: "36" или "35/36")' },
          { status: 400 }
        );
      }
      if (typeof size.count !== 'number' || size.count < 0) {
        return NextResponse.json(
          { error: 'Каждый размер должен иметь количество (число >= 0)' },
          { status: 400 }
        );
      }
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
    const productData: any = {
      name: name.trim(),
      slug,
      article,
      categoryId,
      pricePair: parseFloat(pricePair),
      buyPrice: buyPrice ? parseFloat(buyPrice) : null,
      currency,
      material: material.trim(),
      gender: gender,
      season: season,
      description: description.trim(),
      sizes: sizes,
      isActive,
      source: 'MANUAL', // Manually created products from admin panel
      activeUpdatedAt: new Date(),
    };

    // Add provider if provided
    if (providerId) {
      // providerId might be a User ID (from SupplierSelector) or a Provider ID
      // First, check if it's a User ID by trying to find a user with this ID
      const user = await prisma.user.findUnique({
        where: { id: providerId },
        select: { id: true, providerId: true, role: true, name: true, phone: true },
      });

      let actualProviderId: string | null = null;

      if (user && user.role === 'PROVIDER' && user.id) {
        if (user.providerId) {
          // User has a providerId, use it
          actualProviderId = user.providerId;
        } else {
          // User is PROVIDER but doesn't have a providerId - find or create one
          const providerName = user.name || user.phone || `Provider ${user.id.slice(0, 8)}`;

          // First, try to find an existing provider with this name
          let existingProvider = await prisma.provider.findFirst({
            where: { name: providerName },
            select: { id: true },
          });

          if (!existingProvider) {
            // If no provider exists, try to find one by phone
            if (user.phone) {
              existingProvider = await prisma.provider.findFirst({
                where: { phone: user.phone },
                select: { id: true },
              });
            }

            // If still no provider, create a new one with a unique name
            if (!existingProvider) {
              let uniqueName = providerName;
              let counter = 1;

              // Ensure the name is unique
              while (await prisma.provider.findUnique({ where: { name: uniqueName } })) {
                uniqueName = `${providerName} ${counter}`;
                counter++;
              }

              existingProvider = await prisma.provider.create({
                data: {
                  name: uniqueName,
                  phone: user.phone || null,
                },
              });
            }
          }

          // Update user with the providerId
          await prisma.user.update({
            where: { id: user.id },
            data: { providerId: existingProvider.id },
          });
          actualProviderId = existingProvider.id;
        }
      } else if (!user) {
        // Check if it's already a Provider ID
        const provider = await prisma.provider.findUnique({
          where: { id: providerId },
          select: { id: true },
        });
        if (provider) {
          actualProviderId = provider.id;
        }
      }

      if (actualProviderId) {
        productData.provider = { connect: { id: actualProviderId } };
      } else {
        console.warn(
          `Could not resolve provider for ${providerId}. Cannot set product provider.`
        );
      }
    }

    const product = await prisma.product.create({
      data: productData,
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
      'buyPrice',
      'currency',
      'material',
      'gender',
      'season',
      'description',
      'availabilityCheckedAt',
      'isActive',
      'sizes',
      'sourceMessageIds',
      'sourceScreenshotUrl',
      'sourceScreenshotKey',
      'analysisBatchId',
      'colorBatchId',
      'batchProcessingStatus',
      'gptRequest',
      'gptResponse',
    ] as any;

    const updateData: Record<string, unknown> = {};
    for (const key of allowedScalarKeys) {
      if (key in rawUpdateData) {
        const value = (rawUpdateData as any)[key];
        // Handle buyPrice parsing similar to POST
        if (key === 'buyPrice') {
          updateData[key as string] = value !== null && value !== undefined ? parseFloat(value) : null;
        } else if (key === 'pricePair') {
          updateData[key as string] = parseFloat(value);
        } else {
          updateData[key as string] = value;
        }
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
    if ('providerId' in rawUpdateData) {
      if (rawUpdateData.providerId) {
        // providerId might be a User ID (from SupplierSelector) or a Provider ID
        // First, check if it's a User ID by trying to find a user with this ID
        const user = await prisma.user.findUnique({
          where: { id: rawUpdateData.providerId },
          select: { id: true, providerId: true, role: true, name: true, phone: true },
        });

        let actualProviderId: string | null = null;

        if (user && user.role === 'PROVIDER' && user.id) {
          if (user.providerId) {
            // User has a providerId, use it
            actualProviderId = user.providerId;
          } else {
            // User is PROVIDER but doesn't have a providerId - find or create one
            const providerName = user.name || user.phone || `Provider ${user.id.slice(0, 8)}`;

            // First, try to find an existing provider with this name
            let existingProvider = await prisma.provider.findFirst({
              where: { name: providerName },
              select: { id: true },
            });

            if (!existingProvider) {
              // If no provider exists, try to find one by phone
              if (user.phone) {
                existingProvider = await prisma.provider.findFirst({
                  where: { phone: user.phone },
                  select: { id: true },
                });
              }

              // If still no provider, create a new one with a unique name
              if (!existingProvider) {
                let uniqueName = providerName;
                let counter = 1;

                // Ensure the name is unique
                while (await prisma.provider.findUnique({ where: { name: uniqueName } })) {
                  uniqueName = `${providerName} ${counter}`;
                  counter++;
                }

                existingProvider = await prisma.provider.create({
                  data: {
                    name: uniqueName,
                    phone: user.phone || null,
                  },
                });
              }
            }

            // Update user with the providerId
            await prisma.user.update({
              where: { id: user.id },
              data: { providerId: existingProvider.id },
            });
            actualProviderId = existingProvider.id;
          }
        } else if (!user) {
          // Check if it's already a Provider ID
          const provider = await prisma.provider.findUnique({
            where: { id: rawUpdateData.providerId },
            select: { id: true },
          });
          if (provider) {
            actualProviderId = provider.id;
          }
        }

        if (actualProviderId) {
          updateData.provider = { connect: { id: actualProviderId } };
        } else {
          console.warn(
            `Could not resolve provider for ${rawUpdateData.providerId}. Cannot set product provider.`
          );
        }
      } else {
        // Clear provider if providerId is null
        updateData.provider = { disconnect: true };
      }
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
