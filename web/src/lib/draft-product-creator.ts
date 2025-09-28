import { generateArticleNumber } from './article-generator';
import { prisma } from './db-node';
import { ImageData } from './draft-image-processor';

export interface DraftProductData {
  name: string | null;
  pricePair: number | null;
  currency: string;
  // removed from DB
  gender: 'FEMALE' | 'MALE' | 'UNISEX' | null;
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | null;
  description: string | null;
  sizes: Array<{ size: string; stock: number }> | null;
  providerDiscount: number | null;
}

/**
 * Get or create provider from message data
 */
export async function getOrCreateProvider(
  from: string,
  fromName: string
): Promise<string> {
  // Import the provider utils function
  const { getOrCreateProvider: getOrCreateProviderUtil } = await import(
    './provider-utils'
  );

  // Extract name and place from the sender name
  const { extractProviderFromSenderName } = await import('./provider-utils');
  const { name, place } = extractProviderFromSenderName(fromName);

  const providerId = await getOrCreateProviderUtil(from, name, place);
  if (!providerId) {
    throw new Error('Failed to create or find provider');
  }

  return providerId;
}

/**
 * Create draft product from processed data
 */
interface CreateDraftProductParams {
  messageId: string;
  providerId: string;
  productData: DraftProductData;
  gptRequest: string;
  rawGptResponse: unknown;
  sourceMessageIds: string[];
  imageData: ImageData[];
}

export async function createDraftProduct({
  messageId,
  providerId,
  productData,
  gptRequest,
  rawGptResponse,
  sourceMessageIds,
  imageData,
}: CreateDraftProductParams): Promise<{ id: string }> {
  // Generate unique article number
  const article = await generateArticleNumber();

  // Create the draft product
  const draftProduct = await prisma.waDraftProduct.create({
    data: {
      messageId,
      providerId,
      name: productData.name,
      article,
      pricePair: productData.pricePair,
      currency: productData.currency,

      gender: productData.gender,
      season: productData.season,
      description: productData.description,
      sizes: productData.sizes as any,
      providerDiscount: productData.providerDiscount,
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
          color: img.color || null,
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

  return { id: draftProduct.id };
}
