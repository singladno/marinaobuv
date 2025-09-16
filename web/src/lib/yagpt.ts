import { ProductDraftSchema, type ProductDraft } from '@/types/draft';

import { env } from './env';
import { getSystemPrompt } from './gpt-prompt';

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
  const firstBrace = cleanedJson.indexOf('{');
  const lastBrace = cleanedJson.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = cleanedJson.substring(firstBrace, lastBrace + 1);
    return JSON.parse(extracted);
  }
  throw new Error('Could not extract valid JSON');
}

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
        // If still fails, try to clean up the JSON more aggressively
        const cleanedJson = cleanJsonString(jsonMatch[0]);
        try {
          return JSON.parse(cleanedJson);
        } catch {
          return extractJsonFromString(cleanedJson);
        }
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
