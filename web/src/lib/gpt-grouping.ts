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
  console.log(
    `Analyzing ${messageIds.length} messages with GPT for intelligent grouping...`
  );

  // Process messages in batches of 50 to avoid API limits
  const batchSize = 50;
  const allGroups: MessageGroup[] = [];
  let groupCounter = 0;

  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batchMessageIds = messageIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(messageIds.length / batchSize);

    console.log(
      `\n🔄 Processing batch ${batchNumber}/${totalBatches}: ${batchMessageIds.length} messages`
    );
    console.log(
      `   Messages ${i + 1}-${Math.min(i + batchSize, messageIds.length)} of ${messageIds.length}`
    );

    const batchGroups = await processBatch(batchMessageIds, groupCounter);
    allGroups.push(...batchGroups);
    groupCounter += batchGroups.length;

    console.log(
      `✅ Batch ${batchNumber} complete: ${batchGroups.length} groups created`
    );
    console.log(`   Total groups so far: ${allGroups.length}`);

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < messageIds.length) {
      console.log(`⏳ Waiting 1 second before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `GPT analysis complete. Created ${allGroups.length} groups from ${messageIds.length} messages`
  );
  return allGroups;
}

async function processBatch(
  batchMessageIds: string[],
  startGroupCounter: number
): Promise<MessageGroup[]> {
  // Get all messages with their content
  const messages = await prisma.whatsAppMessage.findMany({
    where: { id: { in: batchMessageIds } },
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

  // Prepare messages for GPT analysis (limit text length to avoid token limits)
  const messagesForGPT = messages.map((msg, index) => ({
    id: msg.id,
    index: index + 1,
    sender: msg.fromName || msg.from,
    type: msg.type,
    text: (msg.text || '').substring(0, 200), // Limit text to 200 chars
    hasImage: msg.type === 'image' && !!msg.mediaUrl,
    imageUrl: msg.type === 'image' ? msg.mediaUrl : null,
    timestamp: msg.createdAt.toISOString(),
    timeAgo: getTimeAgo(msg.createdAt, messages[0].createdAt), // Relative time from first message
  }));

  // Helper function to calculate relative time
  function getTimeAgo(messageTime: Date, firstMessageTime: Date): string {
    const diffMs = messageTime.getTime() - firstMessageTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `+${diffDays}d`;
    if (diffHours > 0) return `+${diffHours}h`;
    if (diffMinutes > 0) return `+${diffMinutes}m`;
    return '0m';
  }

  // Create a simplified prompt for GPT
  const gptPrompt = `Group WhatsApp messages by product. Analyze message patterns and timestamps to create accurate product groups.

MESSAGES:
${JSON.stringify(messagesForGPT, null, 1)}

CRITICAL RULES:
1. MAXIMUM 11-12 messages per group - typical product group contains 1-2 text messages + 8-10 image messages
2. If you see 50+ messages from same provider, they likely contain MULTIPLE different products
3. Use timeAgo field to determine grouping - messages for same product are usually sent close together in time (within minutes)
4. Analyze imageUrl field when in doubt - different products will have visually different images
5. Separate different products even from same sender - one provider can send multiple products
6. If multiple images followed by one text with details, create separate groups for each image but include the shared text in each group
7. Look for price changes, different product names, or different visual content to separate products
8. When provider sends many messages quickly, analyze image content to determine product boundaries
9. Provider greetings (like "‼️САЛЮТ 3/4/17,С КОРОБКИ 500Р СКИДКА") should be grouped with the NEXT product messages, not as separate groups

GROUPING STRATEGY:
- Start with timeAgo analysis - group messages that are close in time (within 5-10 minutes)
- For each time cluster, analyze if images show the same product (check imageUrl field)
- If images are different, split into separate product groups
- If text mentions different prices/products, split accordingly
- Maximum 11-12 messages per group - if more, split into multiple products
- Pay special attention to timeAgo gaps - large gaps often indicate different products
- CRITICAL: If you see sequential image messages (each message contains one image) followed by one description text message, group them together as one product group
- The description text message should be included with all the preceding image messages in the same group
- This ensures no data is lost when providers send multiple individual image messages with shared descriptions
- Example: Message1[Image] + Message2[Image] + Message3[Image] + Message4[Text] = One product group

RESPONSE (JSON only):
{
  "groups": [
    {
      "groupId": "group_1", 
      "messageIds": ["msg_id_1", "msg_id_4"],
      "productContext": "Brief description of the product",
      "confidence": 0.95
    }
  ]
}`;

  try {
    console.log(
      `   🤖 Calling YandexGPT API for ${messagesForGPT.length} messages...`
    );

    // Call GPT for analysis using the same auth as yagpt.ts
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
              text: gptPrompt,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `GPT API error: ${response.status} ${response.statusText}`
      );
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

    // Update group IDs to be unique across batches and validate group sizes
    const groups = parsed.groups
      .map((group: any, index: number) => {
        // Validate group size - split if too large
        if (group.messageIds.length > 12) {
          console.log(
            `   ⚠️  Group ${index + 1} has ${group.messageIds.length} messages (max 12), splitting...`
          );
          return splitLargeGroup(group, startGroupCounter + index);
        }

        return {
          groupId: `gpt_${startGroupCounter + index}_${Date.now()}`,
          messageIds: group.messageIds,
          productContext: group.productContext,
          confidence: group.confidence,
        };
      })
      .flat(); // Flatten in case splitLargeGroup returns multiple groups

    console.log(`   📊 Groups created:`);
    groups.forEach((group, index) => {
      console.log(
        `     ${index + 1}. ${group.groupId}: ${group.messageIds.length} messages (confidence: ${group.confidence})`
      );
    });

    return groups;
  } catch (error) {
    console.error(
      'GPT grouping failed for batch, falling back to simple grouping:',
      error
    );
    console.error('Messages being grouped:', messagesForGPT.length);

    // Fallback to simple grouping by sender for this batch
    return fallbackToSimpleGrouping(messages, startGroupCounter);
  }
}

/**
 * Split large groups into smaller ones (max 12 messages each)
 */
function splitLargeGroup(
  group: any,
  startGroupCounter: number
): MessageGroup[] {
  const maxSize = 12;
  const groups: MessageGroup[] = [];
  const messageIds = group.messageIds;

  for (let i = 0; i < messageIds.length; i += maxSize) {
    const chunk = messageIds.slice(i, i + maxSize);
    groups.push({
      groupId: `gpt_${startGroupCounter}_split_${Math.floor(i / maxSize)}_${Date.now()}`,
      messageIds: chunk,
      productContext: `${group.productContext} (part ${Math.floor(i / maxSize) + 1})`,
      confidence: Math.max(0.3, group.confidence - 0.2), // Reduce confidence for split groups
    });
  }

  console.log(
    `   📦 Split into ${groups.length} groups of max ${maxSize} messages each`
  );
  return groups;
}

/**
 * Fallback grouping when GPT fails
 */
function fallbackToSimpleGrouping(
  messages: any[],
  startGroupCounter: number = 0
): MessageGroup[] {
  const groups: MessageGroup[] = [];
  const bySender = messages.reduce(
    (acc, msg) => {
      if (!acc[msg.from]) acc[msg.from] = [];
      acc[msg.from].push(msg);
      return acc;
    },
    {} as Record<string, any[]>
  );

  let groupCounter = startGroupCounter;
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
