import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

function escapeCsvValue(value: unknown): string {
  const stringValue =
    value === null || value === undefined ? '' : String(value);
  const needsQuotes = /[",\n;]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function formatSizes(value: unknown): string {
  if (value === null || value === undefined) return '';
  try {
    // Array of objects like [{size: '36', count: 1}]
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      if (
        value.every(
          item => typeof item === 'object' && item && 'size' in (item as any)
        )
      ) {
        return (value as Array<{ size: string; count?: number }>)
          .map(v => String(v.size))
          .join(',');
      }
      if (
        value.every(
          item => typeof item === 'string' || typeof item === 'number'
        )
      ) {
        return (value as Array<string | number>).map(String).join(',');
      }
      return '';
    }

    // Object map like {"36": true, "37": true}
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      const available = entries
        .filter(([, v]) => v === true || v === 1)
        .map(([k]) => k);
      if (available.length) return available.join(',');
      return '';
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return '';
  } catch {
    return '';
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const purchase = await prisma.purchase.findFirst({
      where: { id, createdById: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                material: true,
                sizes: true,
                article: true,
                images: {
                  orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
                  select: {
                    url: true,
                    isPrimary: true,
                    sort: true,
                    color: true,
                  },
                },
              },
            },
          },
          orderBy: { sortIndex: 'asc' },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    const header = [
      'Наименование',
      'Артикул',
      'Цена, руб.',
      'Старая цена, руб',
      'Описание',
      'Размеры',
      'Изображение',
    ].join(';');

    const rows = purchase.items.map(item => {
      const allImages = item.product.images || [];
      // Use the explicitly selected color on the purchase item when available
      const desiredColor = ((item as any).color || '').toLowerCase();
      let sameColorImages = allImages;
      if (desiredColor) {
        sameColorImages = allImages.filter(
          img => (img.color || '').toLowerCase() === desiredColor
        );
      } else {
        // Fallback to primary group: either primary image's color group, or no-color images
        const primaryImage =
          allImages.find(img => img.isPrimary) || allImages[0];
        const primaryColor = (primaryImage?.color || '').toLowerCase();
        if (primaryColor) {
          sameColorImages = allImages.filter(
            img => (img.color || '').toLowerCase() === primaryColor
          );
        } else {
          const noColor = allImages.filter(img => !img.color);
          if (noColor.length > 0) sameColorImages = noColor;
        }
        if (sameColorImages.length === 0 && primaryImage) {
          sameColorImages = [primaryImage];
        }
      }
      const imageUrls = sameColorImages
        .map(img => img.url)
        .filter(Boolean)
        .join(',');
      const sizesValue = item.product.sizes
        ? formatSizes(item.product.sizes)
        : '';
      return [
        escapeCsvValue(item.name),
        escapeCsvValue(item.product.article || ''),
        escapeCsvValue(Number(item.price)),
        escapeCsvValue(Number(item.oldPrice)),
        escapeCsvValue(item.description),
        escapeCsvValue(sizesValue),
        escapeCsvValue(imageUrls),
      ].join(';');
    });

    // First Title Row + header row
    const titleRow = 'Файл выгрузки на сайт покупок';
    const csvContent = ['\uFEFF' + titleRow, header, ...rows].join('\n');

    // Build RFC 5987 compliant Content-Disposition for non-ASCII filenames
    const rawFilename = `purchase-export-${purchase.name}-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    const asciiFallback = rawFilename.replace(/[^\x20-\x7E]/g, '_');
    const encodedUtf8 = encodeURIComponent(rawFilename);

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedUtf8}`
    );
    headers.set('Cache-Control', 'no-store');

    return new NextResponse(csvContent, { headers });
  } catch (error) {
    console.error('Error exporting purchase:', error);
    return NextResponse.json(
      { error: 'Failed to export purchase' },
      { status: 500 }
    );
  }
}
