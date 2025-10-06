import { env } from './env';

export interface GPTGroupResponse {
  groups: Array<{
    messageIds: string[];
    productContext: string;
    confidence: number;
  }>;
}

/**
 * Call YandexGPT API for message grouping
 */
export async function callGPTForGrouping(
  prompt: string
): Promise<GPTGroupResponse> {
  console.log(`   🤖 Calling YandexGPT API...`);

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
    'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
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
          stream: false,
          temperature: 0.1,
          maxTokens: 4000,
        },
        messages: [
          {
            role: 'user',
            text: prompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GPT API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const gptResponse = data.result.alternatives[0].message.text;

  console.log(`   📝 GPT Response received (${gptResponse.length} chars)`);
  console.log('   📄 GPT Response:', gptResponse);

  // Clean up the response (remove markdown code blocks if present)
  let cleanResponse = gptResponse.trim();
  if (cleanResponse.startsWith('```')) {
    cleanResponse = cleanResponse
      .replace(/^```(?:json)?\s*/, '')
      .replace(/\s*```$/, '');
  }

  // Parse GPT response
  const parsed = JSON.parse(cleanResponse);

  if (!parsed.groups || !Array.isArray(parsed.groups)) {
    throw new Error('Invalid GPT response format');
  }

  console.log(`   ✅ GPT identified ${parsed.groups.length} product groups`);

  return parsed as GPTGroupResponse;
}
