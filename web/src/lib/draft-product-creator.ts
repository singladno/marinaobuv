import { prisma } from './db-node';
import { normalizeTextToDraft } from './yagpt';
import { ImageData } from './draft-image-processor';

export interface DraftProductData {
  name: string | null;
  article: string | null;
  pricePair: number | null;
  currency: string;
  packPairs: number | null;
  priceBox: number | null;
  material: string | null;
  gender: 'FEMALE' | 'MALE' | 'UNISEX' | null;
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | null;
  description: string | null;
  sizes: Array<{ size: string; stock: number }> | null;
}

/**
 * Get or create provider from message data
 */
export async function getOrCreateProvider(
  from: string,
  fromName: string
): Promise<string> {
  // Try to find by phone first
  let provider = await prisma.provider.findFirst({
    where: { phone: from },
  });

  if (provider) {
    return provider.id;
  }

  // Try to find by name
  provider = await prisma.provider.findFirst({
    where: { name: fromName },
  });

  if (provider) {
    return provider.id;
  }

  // Create new provider
  const newProvider = await prisma.provider.create({
    data: {
      name: fromName,
      phone: from,
      isActive: true,
    },
  });

  return newProvider.id;
}

/**
 * Create draft product from processed data
 */
export async function createDraftProduct(
  messageId: string,
  providerId: string,
  productData: DraftProductData,
  gptRequest: string,
  rawGptResponse: any,
  sourceMessageIds: string[],
  imageData: ImageData[]
): Promise<void> {
  // Create the draft product
  const draftProduct = await prisma.waDraftProduct.create({
    data: {
      messageId,
      providerId,
      name: productData.name!,
      article: productData.article,
      pricePair: productData.pricePair,
      currency: productData.currency,
      packPairs: productData.packPairs,
      priceBox: productData.priceBox,
      material: productData.material,
      gender: productData.gender,
      season: productData.season,
      description: productData.description,
      sizes: productData.sizes as any,
      rawGptResponse: rawGptResponse as any,
      gptRequest,
      source: sourceMessageIds as any,
      status: 'draft',
    },
  });

  // Create image records
  console.log(`Creating ${imageData.length} image records in database...`);
  for (let i = 0; i < imageData.length; i++) {
    const img = imageData[i];
    try {
      console.log(
        `  📝 Creating image record ${i + 1}/${imageData.length}: ${img.s3Key}`
      );
      await prisma.waDraftProductImage.create({
        data: {
          draftProductId: draftProduct.id,
          key: img.s3Key,
          url: img.url,
          mimeType: img.mime,
          sha256: img.sha256,
          width: img.width,
          height: img.height,
        },
      });
      console.log(`  ✓ Image record created successfully`);
    } catch (error) {
      console.error(
        `  ❌ Failed to create image record for draft product ${draftProduct.id}:`,
        error
      );
    }
  }

  // Link the message to the draft product
  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data: { draftProductId: draftProduct.id },
  });

  console.log(
    `Created draft product ${draftProduct.id} for message ${messageId}`
  );
}
