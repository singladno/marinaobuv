import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingProductId?: string;
  reason?: string;
}

/**
 * Service for checking and preventing duplicate products
 */
export class DeduplicationService {
  /**
   * Check if a product with the same source message IDs already exists
   */
  async checkForDuplicateProduct(
    messageIds: string[]
  ): Promise<DeduplicationResult> {
    if (!messageIds || messageIds.length === 0) {
      return { isDuplicate: false };
    }

    // Sort message IDs for consistent comparison
    const sortedMessageIds = [...messageIds].sort();

    // Check for existing products with the same source message IDs
    // First, get all products and check manually since Prisma JSON queries are complex
    const allProducts = await prisma.product.findMany({
      where: {
        sourceMessageIds: {
          not: Prisma.JsonNull,
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        sourceMessageIds: true,
      },
    });

    // Find exact match
    const existingProduct = allProducts.find(product => {
      if (!product.sourceMessageIds) return false;

      const existingMessageIds = Array.isArray(product.sourceMessageIds)
        ? product.sourceMessageIds
        : JSON.parse(product.sourceMessageIds as string);

      const existingSorted = [...existingMessageIds].sort();
      return (
        JSON.stringify(existingSorted) === JSON.stringify(sortedMessageIds)
      );
    });

    if (existingProduct) {
      return {
        isDuplicate: true,
        existingProductId: existingProduct.id,
        reason: `Product already exists with same source message IDs: ${existingProduct.name} (${existingProduct.id})`,
      };
    }

    return { isDuplicate: false };
  }

  /**
   * Check if messages have already been processed
   * Simplified version since we now use offset-based batching to prevent overlaps
   */
  async checkMessagesAlreadyProcessed(
    messageIds: string[]
  ): Promise<DeduplicationResult> {
    if (!messageIds || messageIds.length === 0) {
      return { isDuplicate: false };
    }

    // Simple check: if any message is already processed, skip the entire batch
    const processedMessages = await prisma.whatsAppMessage.findMany({
      where: {
        id: { in: messageIds },
        processed: true,
      },
      select: {
        id: true,
        waMessageId: true,
      },
    });

    if (processedMessages.length > 0) {
      return {
        isDuplicate: true,
        reason: `Messages already processed: ${processedMessages.map(m => m.waMessageId).join(', ')}`,
      };
    }

    return { isDuplicate: false };
  }

  /**
   * Get all duplicate products in the database
   */
  async findDuplicateProducts(): Promise<{
    duplicates: Array<{
      messageIds: string[];
      products: Array<{
        id: string;
        name: string;
        createdAt: Date;
        article: string;
      }>;
    }>;
    totalDuplicates: number;
  }> {
    // Get all products with sourceMessageIds
    const products = await prisma.product.findMany({
      where: {
        sourceMessageIds: {
          not: Prisma.JsonNull,
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        article: true,
        sourceMessageIds: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group products by their source message IDs
    const messageIdGroups = new Map<
      string,
      Array<{
        id: string;
        name: string;
        createdAt: Date;
        article: string;
      }>
    >();

    products.forEach(product => {
      if (product.sourceMessageIds) {
        const messageIds = Array.isArray(product.sourceMessageIds)
          ? product.sourceMessageIds
          : JSON.parse(product.sourceMessageIds as string);

        const key = JSON.stringify([...messageIds].sort());

        if (!messageIdGroups.has(key)) {
          messageIdGroups.set(key, []);
        }

        messageIdGroups.get(key)!.push({
          id: product.id,
          name: product.name,
          createdAt: product.createdAt,
          article: product.article || 'No article',
        });
      }
    });

    // Find groups with duplicates
    const duplicates = Array.from(messageIdGroups.entries())
      .filter(([_, products]) => products.length > 1)
      .map(([messageIdsJson, products]) => ({
        messageIds: JSON.parse(messageIdsJson),
        products,
      }));

    const totalDuplicates = duplicates.reduce(
      (sum, group) => sum + group.products.length - 1,
      0
    );

    return {
      duplicates,
      totalDuplicates,
    };
  }

  /**
   * Clean up duplicate products, keeping only the first one
   */
  async cleanupDuplicateProducts(): Promise<{
    deletedCount: number;
    keptProducts: string[];
    deletedProducts: string[];
  }> {
    const { duplicates } = await this.findDuplicateProducts();

    const keptProducts: string[] = [];
    const deletedProducts: string[] = [];
    let deletedCount = 0;

    for (const duplicateGroup of duplicates) {
      // Sort products by creation date, keep the first one
      const sortedProducts = duplicateGroup.products.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      const productToKeep = sortedProducts[0];
      const productsToDelete = sortedProducts.slice(1);

      keptProducts.push(productToKeep.id);
      deletedProducts.push(...productsToDelete.map(p => p.id));

      // Delete the duplicate products
      for (const product of productsToDelete) {
        try {
          await prisma.product.delete({
            where: { id: product.id },
          });
          deletedCount++;
          console.log(
            `🗑️  Deleted duplicate product: ${product.id} (${product.name})`
          );
        } catch (error) {
          console.error(`❌ Error deleting product ${product.id}:`, error);
        }
      }
    }

    return {
      deletedCount,
      keptProducts,
      deletedProducts,
    };
  }
}
