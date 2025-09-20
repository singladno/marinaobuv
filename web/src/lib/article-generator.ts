import { prisma } from './db-node';

/**
 * Generate a unique article number for a draft product
 * Format: WA + timestamp + random suffix
 * Example: WA20240920151333A1B2
 */
export async function generateArticleNumber(): Promise<string> {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:T.]/g, '')
    .slice(0, 14); // YYYYMMDDHHMMSS
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars

  const baseArticle = `WA${timestamp}${randomSuffix}`;

  // Check if this article number already exists
  const existingDraft = await prisma.waDraftProduct.findFirst({
    where: { article: baseArticle },
    select: { id: true },
  });

  if (existingDraft) {
    // If exists, add a counter suffix
    let counter = 1;
    let articleNumber = baseArticle;

    while (true) {
      articleNumber = `${baseArticle}${counter.toString().padStart(2, '0')}`;
      const exists = await prisma.waDraftProduct.findFirst({
        where: { article: articleNumber },
        select: { id: true },
      });

      if (!exists) break;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 99) {
        throw new Error('Unable to generate unique article number');
      }
    }

    return articleNumber;
  }

  return baseArticle;
}

/**
 * Generate article number for a product (not draft)
 * Format: PR + timestamp + random suffix
 * Example: PR20240920151333A1B2
 */
export async function generateProductArticleNumber(): Promise<string> {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:T.]/g, '')
    .slice(0, 14); // YYYYMMDDHHMMSS
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars

  const baseArticle = `PR${timestamp}${randomSuffix}`;

  // Check if this article number already exists
  const existingProduct = await prisma.product.findFirst({
    where: { article: baseArticle },
    select: { id: true },
  });

  if (existingProduct) {
    // If exists, add a counter suffix
    let counter = 1;
    let articleNumber = baseArticle;

    while (true) {
      articleNumber = `${baseArticle}${counter.toString().padStart(2, '0')}`;
      const exists = await prisma.product.findFirst({
        where: { article: articleNumber },
        select: { id: true },
      });

      if (!exists) break;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 99) {
        throw new Error('Unable to generate unique article number');
      }
    }

    return articleNumber;
  }

  return baseArticle;
}
