#!/usr/bin/env tsx

/**
 * Script to scan all colors from the database and generate a list of the most used colors
 * This will help create a standardized color list for the system
 */

import './load-env';
import { prisma } from '../lib/db-node';

interface ColorCount {
  color: string;
  count: number;
}

/**
 * Extract main color from compound colors like "синий с желтым" -> "синий"
 */
function extractMainColor(color: string): string {
  const normalized = color.toLowerCase().trim();

  // Remove compound colors - take only the first color before "с", "и", "с/", etc.
  const compoundPatterns = [
    /\s+с\s+/i, // "синий с желтым"
    /\s+и\s+/i, // "синий и желтый"
    /\s+\/\s+/i, // "синий/желтый"
    /\s+,\s+/i, // "синий, желтый"
    /\s+плюс\s+/i, // "синий плюс желтый"
  ];

  for (const pattern of compoundPatterns) {
    if (pattern.test(normalized)) {
      const parts = normalized.split(pattern);
      if (parts.length > 0 && parts[0].trim()) {
        return parts[0].trim();
      }
    }
  }

  return normalized;
}

/**
 * Normalize color name variations
 */
function normalizeColor(color: string): string {
  let normalized = color.toLowerCase().trim();

  // Remove common prefixes/suffixes
  normalized = normalized
    .replace(/^цвет:\s*/i, '')
    .replace(/\s*цвет$/i, '')
    .replace(/^цвета:\s*/i, '')
    .trim();

  // Common variations mapping
  const variations: Record<string, string> = {
    чёрный: 'черный',
    белый: 'белый',
    красный: 'красный',
    синий: 'синий',
    зелёный: 'зеленый',
    зеленый: 'зеленый',
    жёлтый: 'желтый',
    желтый: 'желтый',
    оранжевый: 'оранжевый',
    фиолетовый: 'фиолетовый',
    розовый: 'розовый',
    коричневый: 'коричневый',
    серый: 'серый',
    бежевый: 'бежевый',
    голубой: 'голубой',
    бордовый: 'бордовый',
    малиновый: 'малиновый',
    бирюзовый: 'бирюзовый',
    оливковый: 'оливковый',
    золотой: 'золотой',
    серебряный: 'серебряный',
    разноцветный: 'разноцветный',
    многоцветный: 'разноцветный',
    multicolor: 'разноцветный',
  };

  // Check if we have a direct mapping
  if (normalized in variations) {
    return variations[normalized];
  }

  // Try to find a partial match
  for (const [key, value] of Object.entries(variations)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return normalized;
}

async function scanColors() {
  console.log('🔍 Scanning colors from database...\n');

  try {
    // Get all colors from ProductImage
    const productImageColors = await prisma.productImage.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        color: true,
      },
    });

    // Get all colors from WaDraftProductImage
    const draftImageColors = await prisma.waDraftProductImage.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        color: true,
      },
    });

    // Get all colors from WaDraftProduct
    const draftProductColors = await prisma.waDraftProduct.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        color: true,
      },
    });

    // Get all colors from OrderItem
    const orderItemColors = await prisma.orderItem.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        color: true,
      },
    });

    // Get all colors from PurchaseItem
    const purchaseItemColors = await prisma.purchaseItem.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        color: true,
      },
    });

    // Combine all colors
    const allColors = [
      ...productImageColors.map(img => img.color!),
      ...draftImageColors.map(img => img.color!),
      ...draftProductColors.map(draft => draft.color!),
      ...orderItemColors.map(item => item.color!),
      ...purchaseItemColors.map(item => item.color!),
    ];

    console.log(`📊 Total color entries found: ${allColors.length}\n`);

    // Count occurrences
    const colorCounts = new Map<string, number>();

    for (const color of allColors) {
      // Extract main color from compound colors
      const mainColor = extractMainColor(color);
      // Normalize the color
      const normalized = normalizeColor(mainColor);

      if (normalized && normalized.trim()) {
        colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1);
      }
    }

    // Convert to array and sort by count
    const sortedColors: ColorCount[] = Array.from(colorCounts.entries())
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);

    console.log('📈 Color usage statistics:\n');
    console.log('Top colors by usage:');
    sortedColors.slice(0, 30).forEach((item, index) => {
      console.log(
        `  ${(index + 1).toString().padStart(2)}. ${item.color.padEnd(20)} - ${item.count} occurrences`
      );
    });

    // Get top 20 (excluding разноцветный for now, we'll add it separately)
    const top20 = sortedColors
      .filter(item => item.color !== 'разноцветный')
      .slice(0, 20)
      .map(item => item.color);

    // Add разноцветный to the list
    const finalList = [...top20, 'разноцветный'];

    console.log('\n✅ Recommended standardized color list (21 colors):\n');
    finalList.forEach((color, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${color}`);
    });

    console.log('\n📝 JSON format:\n');
    console.log(JSON.stringify(finalList, null, 2));

    // Also show some examples of compound colors that will be simplified
    console.log('\n⚠️  Examples of compound colors that will be simplified:');
    const compoundExamples = allColors
      .filter(color => {
        const normalized = color.toLowerCase().trim();
        return /\s+с\s+|\s+и\s+|\s+\/\s+/.test(normalized);
      })
      .slice(0, 10);

    compoundExamples.forEach(color => {
      const mainColor = extractMainColor(color);
      const normalized = normalizeColor(mainColor);
      console.log(`  "${color}" → "${normalized}"`);
    });
  } catch (error) {
    console.error('❌ Error scanning colors:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

scanColors();
