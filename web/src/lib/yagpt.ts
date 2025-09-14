import { z } from 'zod';

import { env } from './env';

// Zod schema for the expected YandexGPT response
const ProductDraftSchema = z.object({
  name: z.string(),
  article: z.string().optional(),
  season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  typeSlug: z.string().optional(),
  pricePair: z.number().optional(), // kopecks
  packPairs: z.number().optional(),
  priceBox: z.number().optional(),
  material: z.string().optional(),
  gender: z.enum(['female', 'male', 'unisex']).optional(),
  sizes: z.array(z.object({
    size: z.string(),
    count: z.number(),
  })).optional(),
  notes: z.string().optional(),
});

export type ProductDraft = z.infer<typeof ProductDraftSchema>;

/**
 * Parse JSON content from YandexGPT response
 */
function parseJsonContent(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from the response if it's wrapped in markdown or other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse JSON from YandexGPT response');
  }
}

/**
 * Normalize text to product draft using YandexGPT
 */
export async function normalizeTextToDraft(text: string): Promise<ProductDraft | null> {
  try {
    const authHeader = env.YC_IAM_TOKEN
      ? `Bearer ${env.YC_IAM_TOKEN}`
      : `Api-Key ${env.YC_API_KEY}`;

    const response = await fetch(
      `https://llm.api.cloud.yandex.net/foundationModels/v1/completion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          modelUri: `gpt://${env.YC_FOLDER_ID}/yandexgpt`,
          completionOptions: {
            temperature: 0.2,
            stream: false,
          },
          messages: [
            {
              role: 'system',
              content: `You are a product data extraction assistant for a shoe store.
              Extract product information from the given text and return STRICT JSON matching this schema:
              {
                "name": string,
                "article": string (optional),
                "season": "spring"|"summer"|"autumn"|"winter" (optional),
                "typeSlug": string (optional),
                "pricePair": number (in kopecks, optional),
                "packPairs": number (optional),
                "priceBox": number (optional),
                "material": string (optional),
                "gender": "female"|"male"|"unisex" (optional),
                "sizes": Array<{size: string, count: number}> (optional),
                "notes": string (optional)
              }

              Rules:
              - Extract only information explicitly mentioned in the text
              - Convert prices to kopecks (multiply by 100)
              - For sizes, extract both size and quantity if mentioned
              - Return only valid JSON, no additional text
              - If information is not clear, omit the field
              - Be conservative with assumptions`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`YandexGPT API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.result?.alternatives?.[0]?.message?.text;

    if (!content) {
      throw new Error('No content in YandexGPT response');
    }

    const jsonContent = parseJsonContent(content);
    const validated = ProductDraftSchema.parse(jsonContent);

    return validated;
  } catch (error) {
    console.error('Failed to normalize text with YandexGPT:', error);
    return null;
  }
}
