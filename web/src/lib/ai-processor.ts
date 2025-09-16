import { prisma } from './db-node';
import {
  normalizeTextToDraft,
  mapSeasonToPrisma,
  mapGenderToPrisma,
} from './yagpt';

export async function processTextWithAI(
  text: string,
  messageId: string
): Promise<void> {
  try {
    console.log(
      'Processing text with YandexGPT:',
      text.substring(0, 100) + '...'
    );

    const gptResult = await normalizeTextToDraft(text);

    if (gptResult.success && gptResult.data) {
      const draft = gptResult.data;

      // Convert enums to Prisma format
      const season = mapSeasonToPrisma(draft.season);
      const gender = mapGenderToPrisma(draft.gender);

      // Save product draft
      await prisma.productDraft.upsert({
        where: { messageId },
        update: {
          name: draft.name,
          season,
          typeSlug: draft.typeSlug,
          pricePair: draft.pricePair,
          packPairs: draft.packPairs,
          priceBox: draft.priceBox,
          material: draft.material,
          gender,
          sizes: draft.sizes || undefined,
          rawGptResponse: gptResult.rawResponse as any,
        },
        create: {
          messageId,
          name: draft.name,
          season,
          typeSlug: draft.typeSlug,
          pricePair: draft.pricePair,
          packPairs: draft.packPairs,
          priceBox: draft.priceBox,
          material: draft.material,
          gender,
          sizes: draft.sizes || undefined,
          rawGptResponse: gptResult.rawResponse as any,
        },
      });

      console.log('Product draft created:', {
        name: draft.name,
        season,
        gender,
        pricePair: draft.pricePair,
      });
    } else {
      console.log('YandexGPT processing failed:', gptResult.error);
    }
  } catch (error) {
    console.error('Error processing text with YandexGPT:', error);
  }
}
