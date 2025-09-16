import { ProductDraftSchema, type ProductDraft } from '@/types/draft';

import { env } from './env';
import { getSystemPrompt, getValidationPrompt } from './gpt-prompt';
import { getCategoryTree } from './catalog';

// Moved schema and types to @/types/draft to keep this file small

/**
 * Clean JSON string for parsing
 */
function cleanJsonString(jsonStr: string): string {
  return jsonStr
    .replace(/,\s*}/g, '}') // Remove trailing commas before }
    .replace(/,\s*]/g, ']') // Remove trailing commas before ]
    .replace(/(\w+):/g, '"$1":') // Add quotes around keys if missing
    .replace(/:(\w+)/g, ':"$1"') // Add quotes around string values if missing
    .replace(/:(\d+)/g, ':$1') // Keep numbers as numbers
    .replace(/:true/g, ':true') // Keep booleans
    .replace(/:false/g, ':false')
    .replace(/:null/g, ':null')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract JSON from cleaned string
 */
function extractJsonFromString(cleanedJson: string): unknown {
  // Find the first complete JSON object by counting braces
  const firstBrace = cleanedJson.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('No JSON object found');
  }

  let braceCount = 0;
  let endPos = firstBrace;

  for (let i = firstBrace; i < cleanedJson.length; i++) {
    if (cleanedJson[i] === '{') {
      braceCount++;
    } else if (cleanedJson[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endPos = i;
        break;
      }
    }
  }

  if (braceCount !== 0) {
    throw new Error('Incomplete JSON object');
  }

  const extracted = cleanedJson.substring(firstBrace, endPos + 1);
  return JSON.parse(extracted);
}

/**
 * Parse JSON content from YandexGPT response
 */
function parseJsonContent(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.log('Initial JSON parse failed, trying extraction methods...');

    // Try to extract JSON from the response if it's wrapped in markdown or other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        console.log('Direct JSON match failed, trying cleaned extraction...');
        // If still fails, try to clean up the JSON more aggressively
        const cleanedJson = cleanJsonString(jsonMatch[0]);
        try {
          return JSON.parse(cleanedJson);
        } catch {
          console.log('Cleaned JSON parse failed, trying brace counting...');
          return extractJsonFromString(cleanedJson);
        }
      }
    }

    // If no JSON object found with regex, try to find it manually
    const firstBrace = content.indexOf('{');
    if (firstBrace !== -1) {
      try {
        return extractJsonFromString(content.substring(firstBrace));
      } catch (error4) {
        console.log('Manual extraction failed:', error4);
      }
    }

    throw new Error(
      `Could not parse JSON from YandexGPT response. Original error: ${error}`
    );
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

    // fetch category tree to pass into the system prompt
    let categoryTreeJson = '[]';
    try {
      const tree = await getCategoryTree();
      categoryTreeJson = JSON.stringify(tree);
    } catch {}

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
              text: getSystemPrompt(categoryTreeJson),
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
    console.log(`🔍 Starting second-pass validation for draft: ${draft.name}`);
    console.log(`📸 Examining ${imageUrls.length} images:`, imageUrls);

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
        : draft.name || 'Не указано';

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
