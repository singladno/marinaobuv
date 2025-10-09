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
  console.log(`   📊 Prompt length: ${prompt.length} characters`);

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

  console.log(
    `   🔑 Using ${env.YC_IAM_TOKEN ? 'IAM Token' : 'API Key'} authentication`
  );
  console.log(`   📁 Folder ID: ${env.YC_FOLDER_ID}`);

  const requestBody = {
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
  };

  console.log(`   📤 Sending request to YandexGPT...`);
  console.log(`   ⚙️  Model: yandexgpt, Temperature: 0.1, MaxTokens: 4000`);

  const response = await fetch(
    'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'x-folder-id': env.YC_FOLDER_ID,
      },
      body: JSON.stringify(requestBody),
    }
  );

  console.log(
    `   📡 Response status: ${response.status} ${response.statusText}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`   ❌ API Error Response:`, errorText);
    throw new Error(`GPT API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`   📦 Raw API Response:`, JSON.stringify(data, null, 2));

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

  console.log(`   🧹 Cleaned response:`, cleanResponse);

  // Parse GPT response
  let parsed;
  try {
    parsed = JSON.parse(cleanResponse);
    console.log(`   ✅ Successfully parsed JSON response`);
  } catch (parseError) {
    console.error(`   ❌ JSON Parse Error:`, parseError);
    console.error(`   📄 Raw response that failed to parse:`, cleanResponse);
    throw new Error(`Failed to parse GPT response as JSON: ${parseError}`);
  }

  if (!parsed.groups || !Array.isArray(parsed.groups)) {
    console.error(
      `   ❌ Invalid response format - missing or invalid groups array`
    );
    console.error(`   📄 Parsed response:`, parsed);
    throw new Error(
      'Invalid GPT response format - groups array missing or invalid'
    );
  }

  console.log(`   ✅ GPT identified ${parsed.groups.length} product groups`);
  console.log(
    `   📊 Groups details:`,
    parsed.groups.map(
      (g, i) =>
        `${i + 1}. ${g.messageIds?.length || 0} messages, confidence: ${g.confidence || 'N/A'}`
    )
  );

  return parsed as GPTGroupResponse;
}
