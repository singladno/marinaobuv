import { prisma } from './db-node';
import { normalizeTextToDraft } from './yagpt';
import { mapGender, mapSeason } from './services/product-creation-mappers';

export async function processTextWithAI(
  text: string,
  messageId: string
): Promise<void> {
  try {
    console.log(
      'Processing text with YandexGPT:',
      text.substring(0, 100) + '...'
    );

    const draft = await normalizeTextToDraft(text);

    if (draft) {
      const season = draft.season ? mapSeason(draft.season) : null;
      const gender = draft.gender ? mapGender(draft.gender) : null;

      await prisma.waDraftProduct.upsert({
        where: { messageId },
        update: {
          // name is optional in wa draft; we do not have it from draft
          season: season || undefined,
          pricePair: draft.pricePair ?? undefined,
          gender: (gender as any) || undefined,
          sizes: draft.sizes || undefined,
          rawGptResponse: undefined,
        },
        create: {
          messageId,
          providerId: 'unknown',
          name: null,
          season: season as any,
          pricePair: (draft.pricePair as any) ?? null,
          gender: (gender as any) ?? null,
          sizes: (draft.sizes as any) ?? null,
          status: 'draft',
        },
      });

      console.log('Product draft created/updated:', {
        season,
        gender,
        pricePair: draft.pricePair,
      });
    } else {
      console.log('YandexGPT processing failed: no draft returned');
    }
  } catch (error) {
    console.error('Error processing text with YandexGPT:', error);
  }
}
