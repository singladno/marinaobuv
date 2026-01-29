import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import * as XLSX from 'xlsx';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

function escapeCsvValue(value: unknown): string {
  const stringValue =
    value === null || value === undefined ? '' : String(value);
  const needsQuotes = /[",\n;]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function formatSizes(value: unknown, measurementUnit?: 'PAIRS' | 'PIECES'): string {
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
        // If measurement unit is PIECES (штука), format as repeated "1" for each count
        if (measurementUnit === 'PIECES') {
          const result: string[] = [];
          for (const v of value as Array<{ size: string; count?: number }>) {
            const count = v.count || 1;
            for (let i = 0; i < count; i++) {
              result.push('1');
            }
          }
          return result.join(', ');
        }
        // For PAIRS, use the original format
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
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            oldPrice: true,
            sortIndex: true,
            color: true, // Explicitly select color field
            product: {
              select: {
                id: true,
                slug: true,
                material: true,
                sizes: true,
                article: true,
                measurementUnit: true,
                images: {
                  where: {
                    isActive: true,
                  },
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
    ];

    const rows = purchase.items.map(item => {
      const allImages = item.product.images || [];
      // Get the color from the purchase item (explicitly selected in query)
      const itemColor = item.color;
      let sameColorImages: typeof allImages = [];

      // Normalize function for color comparison
      // Handles spaces, case, and common variations
      const normalizeColor = (color: string | null | undefined): string => {
        if (!color) return '';
        // Convert to lowercase, trim, and remove all spaces for comparison
        // This handles cases like "Вассортименте" vs "в ассортименте"
        return color.toLowerCase().trim().replace(/\s+/g, '');
      };

      if (itemColor) {
        // Purchase item has a color specified - ONLY use images with that exact color
        // OR images with no color set (null) - since there's no color conflict
        const normalizedItemColor = normalizeColor(itemColor);
        sameColorImages = allImages.filter(img => {
          const imgColor = normalizeColor(img.color);
          // Match exact color OR no color set (empty string after normalization)
          const matches = imgColor === normalizedItemColor || imgColor === '';

          // Debug logging for specific articles
          if (
            item.product.article === '215126' ||
            item.product.article === '918391'
          ) {
            console.log(
              `[Export Debug] Article ${item.product.article} - Purchase item color: "${itemColor}" (normalized: "${normalizedItemColor}"), Image color: "${img.color}" (normalized: "${imgColor}"), Matches: ${matches}`
            );
          }

          return matches;
        });

        // If no exact matches found, fall back to images with null colors
        // This handles cases where purchase item color doesn't match any image colors
        if (sameColorImages.length === 0) {
          const nullColorImages = allImages.filter(
            img => !img.color || normalizeColor(img.color) === ''
          );
          if (nullColorImages.length > 0) {
            sameColorImages = nullColorImages;
            // Debug logging
            if (
              item.product.article === '215126' ||
              item.product.article === '918391'
            ) {
              console.log(
                `[Export Debug] Article ${item.product.article} - No exact color match for "${itemColor}", using ${nullColorImages.length} images with null colors`
              );
            }
          } else {
            // If no null color images either, use all images as last resort
            // This handles data mismatches where purchase item color doesn't match any images
            sameColorImages = allImages;
            if (
              item.product.article === '215126' ||
              item.product.article === '918391'
            ) {
              console.log(
                `[Export Debug] Article ${item.product.article} - No exact color match for "${itemColor}" and no null color images, using all ${allImages.length} images as fallback`
              );
            }
          }
        }

        // Debug logging for specific articles
        if (
          item.product.article === '215126' ||
          item.product.article === '918391'
        ) {
          console.log(
            `[Export Debug] Article ${item.product.article} - Total images: ${allImages.length}, Matched images: ${sameColorImages.length}, Purchase item color: "${itemColor}"`
          );
        }
      } else {
        // No color specified on purchase item - use all images
        // This ensures products without colors on purchase items still get images
        sameColorImages = allImages;
      }

      const imageUrls = sameColorImages
        .map(img => img.url)
        .filter(Boolean)
        .join(',');
      const sizesValue = item.product.sizes
        ? formatSizes(item.product.sizes, item.product.measurementUnit as 'PAIRS' | 'PIECES' | undefined)
        : '';
      return [
        item.name,
        item.product.article || '',
        Number(item.price),
        Number(item.oldPrice),
        item.description,
        sizesValue,
        imageUrls,
      ];
    });

    // First Title Row + header row
    const titleRow = ['Файл выгрузки на сайт покупок'];

    const worksheetData: (string | number)[][] = [titleRow, header, ...rows];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

    const xlsxArrayBuffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
    }) as ArrayBuffer;

    // Build RFC 5987 compliant Content-Disposition for non-ASCII filenames
    const rawFilename = `purchase-export-${purchase.name}-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    const asciiFallback = rawFilename.replace(/[^\x20-\x7E]/g, '_');
    const encodedUtf8 = encodeURIComponent(rawFilename);

    const headers = new Headers();
    headers.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    headers.set(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedUtf8}`
    );
    headers.set('Cache-Control', 'no-store');

    return new NextResponse(xlsxArrayBuffer, { headers });
  } catch (error) {
    console.error('Error exporting purchase:', error);
    return NextResponse.json(
      { error: 'Failed to export purchase' },
      { status: 500 }
    );
  }
}
