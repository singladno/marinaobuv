import { prisma } from './db-node';
import { env } from './env';

export interface MessageGroup {
  groupId: string;
  messageIds: string[];
  productContext: string;
  confidence: number;
}

/**
 * Group messages using GPT analysis
 */
export async function groupMessagesWithGPT(
  messageIds: string[]
): Promise<MessageGroup[]> {
  console.log(`Analyzing ${messageIds.length} messages with GPT for intelligent grouping...`);

  // Get all messages with their content
  const messages = await prisma.whatsAppMessage.findMany({
    where: { id: { in: messageIds } },
    select: {
      id: true,
      from: true,
      fromName: true,
      text: true,
      type: true,
      mediaUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (messages.length === 0) {
    return [];
  }

  // Prepare messages for GPT analysis
  const messagesForGPT = messages.map((msg, index) => ({
    id: msg.id,
    index: index + 1,
    sender: msg.fromName || msg.from,
    type: msg.type,
    text: msg.text || '',
    hasImage: msg.type === 'image' && !!msg.mediaUrl,
    timestamp: msg.createdAt.toISOString(),
  }));

  // Create a comprehensive prompt for GPT
  const gptPrompt = `You are analyzing WhatsApp messages from a shoe store group chat. Your task is to group messages that belong to the same product posting.

MESSAGES TO ANALYZE:
${JSON.stringify(messagesForGPT, null, 2)}

INSTRUCTIONS:
1. Group messages that belong to the same product posting
2. Consider text content, images, and timing
3. Messages from the same sender can have multiple different products
4. Look for product descriptions, prices, sizes, materials
5. Group consecutive messages that describe the same product
6. Separate different products even from the same sender

RESPONSE FORMAT (JSON):
{
  "groups": [
    {
      "groupId": "group_1",
      "messageIds": ["msg_id_1", "msg_id_2", "msg_id_3"],
      "productContext": "Brief description of what product this group represents",
      "confidence": 0.95
    }
  ],
  "reasoning": "Brief explanation of your grouping decisions"
}

IMPORTANT:
- Return ONLY valid JSON
- Group IDs should be unique (group_1, group_2, etc.)
- Message IDs must match exactly from the input
- Confidence should be 0.0 to 1.0
- If a message doesn't fit any group, create a single-message group
- Be conservative - only group messages you're confident belong together`;

  try {
    // Call GPT for analysis using the same auth as yagpt.ts
    const authHeader = env.YC_IAM_TOKEN
      ? `Bearer ${env.YC_IAM_TOKEN}`
      : `Api-Key ${env.YC_API_KEY}`;

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
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
            text: gptPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`GPT API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const gptResponse = data.result.alternatives[0].message.text;

    console.log('GPT Response:', gptResponse);

    // Clean up the response (remove markdown code blocks if present)
    let cleanResponse = gptResponse.trim();
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    // Parse GPT response
    const parsed = JSON.parse(cleanResponse);
    
    if (!parsed.groups || !Array.isArray(parsed.groups)) {
      throw new Error('Invalid GPT response format');
    }

    console.log(`GPT identified ${parsed.groups.length} product groups`);
    console.log('Reasoning:', parsed.reasoning);

    return parsed.groups.map((group: any) => ({
      groupId: group.groupId,
      messageIds: group.messageIds,
      productContext: group.productContext,
      confidence: group.confidence,
    }));

  } catch (error) {
    console.error('GPT grouping failed, falling back to simple grouping:', error);
    
    // Fallback to simple grouping by sender
    return fallbackToSimpleGrouping(messages);
  }
}

/**
 * Fallback grouping when GPT fails
 */
function fallbackToSimpleGrouping(messages: any[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  const bySender = messages.reduce((acc, msg) => {
    if (!acc[msg.from]) acc[msg.from] = [];
    acc[msg.from].push(msg);
    return acc;
  }, {} as Record<string, any[]>);

  let groupCounter = 0;
  Object.entries(bySender).forEach(([sender, msgs]) => {
    const groupId = `fallback_${sender}_${groupCounter++}`;
    groups.push({
      groupId,
      messageIds: msgs.map(m => m.id),
      productContext: `Messages from ${msgs[0].fromName || sender}`,
      confidence: 0.5,
    });
  });

  return groups;
}
