import { ProductDraftSchema, type ProductDraft } from '@/types/draft';

import { env } from './env';
import { getSystemPrompt, getValidationPrompt } from './gpt-prompt';
import { parseJsonContent } from './yagpt-json-parser';

/**
 * Normalize text to product draft using YandexGPT
 */
export async function normalizeTextToDraft(
  text: string
): Promise<ProductDraft | null> {
  try {
    // Type guards for required environment variables
    if (!env.YC_FOLDER_ID) {
      throw new Error('YC_FOLDER_ID is required');
    }
    if (!env.YC_IAM_TOKEN && !env.YC_API_KEY) {
      throw new Error('Either YC_IAM_TOKEN or YC_API_KEY is required');
    }

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
              text: getSystemPrompt(),
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

    // Log the raw response for debugging
    console.log('YandexGPT raw response:', content);

    const jsonContent = parseJsonContent(content);

    console.log('Parsed JSON content:', JSON.stringify(jsonContent, null, 2));

    const validated = ProductDraftSchema.parse(jsonContent);
    return validated;
  } catch (error) {
    console.error('Failed to normalize text with YandexGPT:', error);
    console.error(
      'Input text that caused error:',
      text.substring(0, 200) + '...'
    );
    return null;
  }
}

/**
 * Validate and enrich a parsed draft against its images.
 * Returns normalizedName, productColor, and per-image flags/colors.
 */
export async function validateDraftWithImages(
  draft: ProductDraft,
  imageUrls: string[]
): Promise<{
  normalizedName: string;
  productColor: string | null;
  images: Array<{ url: string; isFalseImage: boolean; color?: string | null }>;
  requestPayload: unknown;
  rawResponse: unknown;
} | null> {
  try {
    console.log(`🔍 Starting second-pass validation for draft`);
    console.log(`📸 Examining ${imageUrls.length} images:`, imageUrls);

    // Type guards for required environment variables
    if (!env.YC_FOLDER_ID) {
      throw new Error('YC_FOLDER_ID is required');
    }
    if (!env.YC_IAM_TOKEN && !env.YC_API_KEY) {
      throw new Error('Either YC_IAM_TOKEN or YC_API_KEY is required');
    }

    const authHeader = env.YC_IAM_TOKEN
      ? `Bearer ${env.YC_IAM_TOKEN}`
      : `Api-Key ${env.YC_API_KEY}`;

    const requestPayload = JSON.stringify({ draft, imageUrls });
    console.log(`📤 Second-pass request payload:`, requestPayload);

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
          completionOptions: { temperature: 0.1, stream: false },
          messages: [
            { role: 'system', text: getValidationPrompt() },
            { role: 'user', text: requestPayload },
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
      throw new Error('No content in YandexGPT validation response');
    }

    console.log(`📥 Second-pass raw response:`, content);

    const jsonContent = parseJsonContent(content) as any;
    console.log(
      `📋 Parsed second-pass response:`,
      JSON.stringify(jsonContent, null, 2)
    );

    // Basic shape enforcement
    const normalizedName: string =
      typeof jsonContent?.normalizedName === 'string' &&
      jsonContent.normalizedName.trim()
        ? jsonContent.normalizedName.trim()
        : 'Не указано';

    const productColor: string | null =
      typeof jsonContent?.productColor === 'string' &&
      jsonContent.productColor.trim()
        ? jsonContent.productColor.trim()
        : null;

    const images: Array<{
      url: string;
      isFalseImage: boolean;
      color?: string | null;
    }> = Array.isArray(jsonContent?.images)
      ? jsonContent.images.map((img: any, idx: number) => ({
          url: typeof img?.url === 'string' ? img.url : imageUrls[idx] || '',
          isFalseImage: Boolean(img?.isFalseImage),
          color:
            typeof img?.color === 'string' && img.color.trim()
              ? img.color.trim()
              : undefined,
        }))
      : imageUrls.map(u => ({ url: u, isFalseImage: false }));

    return {
      normalizedName,
      productColor,
      images,
      requestPayload,
      rawResponse: jsonContent,
    };
  } catch (error) {
    console.error('Failed second-pass validation with YandexGPT:', error);
    return null;
  }
}
