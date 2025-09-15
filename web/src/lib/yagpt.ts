import { z } from 'zod';

import { env } from './env';

// Zod schema for the expected YandexGPT response
const ProductDraftSchema = z.object({
  name: z.string(),
  article: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  season: z
    .enum(['spring', 'summer', 'autumn', 'winter'])
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  typeSlug: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  pricePair: z
    .number()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)), // kopecks
  packPairs: z
    .number()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  priceBox: z
    .number()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  material: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  gender: z
    .enum(['female', 'male', 'unisex'])
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  sizes: z
    .array(
      z.object({
        size: z.string(),
        count: z
          .number()
          .nullable()
          .transform(val => (val === null ? 0 : val)),
      })
    )
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val === null ? undefined : val)),
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
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // If still fails, try to clean up the JSON
        const cleanedJson = jsonMatch[0]
          .replace(/,\s*}/g, '}') // Remove trailing commas before }
          .replace(/,\s*]/g, ']') // Remove trailing commas before ]
          .replace(/(\w+):/g, '"$1":') // Add quotes around keys if missing
          .replace(/:(\w+)/g, ':"$1"') // Add quotes around string values if missing
          .replace(/:(\d+)/g, ':$1') // Keep numbers as numbers
          .replace(/:true/g, ':true') // Keep booleans
          .replace(/:false/g, ':false')
          .replace(/:null/g, ':null');

        return JSON.parse(cleanedJson);
      }
    }
    throw new Error('Could not parse JSON from YandexGPT response');
  }
}

/**
 * Normalize text to product draft using YandexGPT
 */
export async function normalizeTextToDraft(
  text: string
): Promise<ProductDraft | null> {
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
          Authorization: authHeader,
          'x-folder-id': env.YC_FOLDER_ID,
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
              text: `You are a product data extraction assistant for a shoe store.
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
              - The text may contain multiple messages from the same user about the same product
              - Combine all information from all messages to create a complete product description
              - Extract only information explicitly mentioned in the text
              - Convert prices to kopecks (multiply by 100)
              - For sizes, extract both size and quantity if mentioned
              - Return only valid JSON, no additional text
              - If information is not clear, omit the field entirely (do not include null values)
              - Be conservative with assumptions
              - Only include fields that have actual values
              - If there are multiple product names mentioned, use the most descriptive one
              - Combine all price information from different messages`,
            },
            {
              role: 'user',
              text: text,
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

    // Log the raw response for debugging
    console.log(
      'YandexGPT raw response:',
      JSON.stringify(jsonContent, null, 2)
    );

    const validated = ProductDraftSchema.parse(jsonContent);

    return validated;
  } catch (error) {
    console.error('Failed to normalize text with YandexGPT:', error);
    return null;
  }
}
