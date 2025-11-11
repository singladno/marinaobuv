import Groq from 'groq-sdk';
import { prisma } from '../db-node';
import { getGroqConfig } from '../groq-proxy-config';
import { getTokenLogger } from '../utils/groq-token-logger';
import { env } from '../env';
import {
  GROUPING_SYSTEM_PROMPT,
  GROUPING_USER_PROMPT,
} from '../prompts/grouping-prompts';

export interface MessageGroup {
  groupId: string;
  messageIds: string[];
  productContext: string;
  confidence: number;
}

export interface GroupingDebugInfo {
  request: string;
  response: string;
  messageCount: number;
  messageIds: string[];
}

/**
 * Service for grouping WhatsApp messages using Groq
 */
export class GroqGroupingService {
  private groq: Groq | null = null;
  private textModel: string;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is required');
    }
    // Prefer grouping-specific override, then generic text model. Default to production Llama 3.1 8B
    this.textModel =
      process.env.GROQ_GROUPING_MODEL ||
      process.env.GROQ_TEXT_MODEL ||
      'llama-3.1-8b-instant';
  }

  private async initializeGroq(): Promise<Groq> {
    if (!this.groq) {
      const config = await getGroqConfig();
      this.groq = new Groq(config);
    }
    return this.groq;
  }

  /**
   * Group messages using Groq with batching to stay under 8K tokens
   */
  async groupMessages(messages: any[]): Promise<MessageGroup[]> {
    if (messages.length === 0) return [];

    // Use PROCESSING_BATCH_SIZE for consistency, but cap at 40 for Groq token limits
    const maxPerCall = Math.min(env.PROCESSING_BATCH_SIZE || 40, 40);

    // If messages fit in one batch, process directly
    if (messages.length <= maxPerCall) {
      return await this.groupMessagesBatch(messages);
    }

    // Otherwise, split into batches
    console.log(
      `📊 Grouping ${messages.length} messages in batches of ${maxPerCall} with Groq...`
    );

    const allGroups: MessageGroup[] = [];

    // Sort messages by timestamp to maintain chronological order
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt || a.timestamp).getTime() -
        new Date(b.createdAt || b.timestamp).getTime()
    );

    // Process in batches
    for (let i = 0; i < sortedMessages.length; i += maxPerCall) {
      const batch = sortedMessages.slice(i, i + maxPerCall);
      console.log(
        `📦 Processing batch ${Math.floor(i / maxPerCall) + 1}/${Math.ceil(sortedMessages.length / maxPerCall)} (${batch.length} messages)`
      );

      const batchGroups = await this.groupMessagesBatch(batch);
      allGroups.push(...batchGroups);
    }

    console.log(
      `✅ Total: ${allGroups.length} groups from ${messages.length} messages across ${Math.ceil(sortedMessages.length / maxPerCall)} batches`
    );

    return allGroups;
  }

  /**
   * Group a single batch of messages (max maxPerCall messages)
   */
  private async groupMessagesBatch(messages: any[]): Promise<MessageGroup[]> {
    try {
      // Prepare messages for grouping
      const messagesText = this.prepareMessagesForGrouping(messages);

      // Prepare the full request for debugging
      const fullRequest = {
        model: this.textModel,
        messages: [
          {
            role: 'system',
            content: GROUPING_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: GROUPING_USER_PROMPT(messagesText),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      };

      const response = await (
        await this.initializeGroq()
      ).chat.completions.create(fullRequest as any);

      // Log token usage
      if (response.usage) {
        getTokenLogger().log(
          'message-grouping',
          this.textModel,
          response.usage,
          {
            messageCount: messages.length,
            messageTextLength: messagesText.length,
          }
        );
      }

      const result = JSON.parse(response.choices[0].message.content || '{}');

      if (!result.groups || !Array.isArray(result.groups)) {
        console.log('❌ Invalid grouping response from Groq');
        return [];
      }

      console.log(
        `✅ Groq grouped ${messages.length} messages into ${result.groups.length} groups`
      );

      // Store the request and response for debugging (only for first batch to avoid spam)
      const maxPerCall = Math.min(env.PROCESSING_BATCH_SIZE || 40, 40);
      if (messages.length <= maxPerCall) {
        await this.storeGroupingDebugInfo(messages, fullRequest, response);
      }

      // Post-process groups: split if text is followed by image, then filter invalid groups
      const processedGroups = await this.postProcessGroups(result.groups, messages);

      return processedGroups;
    } catch (error) {
      console.error('❌ Error grouping messages with Groq:', error);
      return [];
    }
  }

  /**
   * Group messages using Groq and return debug info
   */
  async groupMessagesWithDebug(messages: any[]): Promise<{
    groups: MessageGroup[];
    debugInfo: GroupingDebugInfo;
  }> {
    if (messages.length === 0)
      return {
        groups: [],
        debugInfo: {
          request: '',
          response: '',
          messageCount: 0,
          messageIds: [],
        },
      };

    // Use PROCESSING_BATCH_SIZE for consistency, but cap at 40 for Groq token limits
    const maxPerCall = Math.min(env.PROCESSING_BATCH_SIZE || 40, 40);
    // For debug version, process first batch only (to get debug info)
    const batch = messages.slice(0, maxPerCall);

    try {
      console.log(
        `📊 Grouping ${messages.length} messages with Groq (model: ${this.textModel})...`
      );

      // Prepare messages for grouping (first batch only for debug)
      const messagesText = this.prepareMessagesForGrouping(batch);

      // Prepare the full request for debugging
      const fullRequest = {
        model: this.textModel,
        messages: [
          {
            role: 'system',
            content: GROUPING_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: GROUPING_USER_PROMPT(messagesText),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      };

      const response = await (
        await this.initializeGroq()
      ).chat.completions.create(fullRequest as any);

      // Log token usage
      if (response.usage) {
        getTokenLogger().log(
          'message-grouping-debug',
          this.textModel,
          response.usage,
          {
            messageCount: batch.length,
            messageTextLength: messagesText.length,
          }
        );
      }

      const result = JSON.parse(response.choices[0].message.content || '{}');

      if (!result.groups || !Array.isArray(result.groups)) {
        console.log('❌ Invalid grouping response from Groq');
        return {
          groups: [],
          debugInfo: {
            request: JSON.stringify(fullRequest, null, 2),
            response: JSON.stringify(response, null, 2),
            messageCount: batch.length,
            messageIds: batch.map(m => m.id),
          },
        };
      }

      console.log(
        `✅ Groq grouped ${batch.length} messages into ${result.groups.length} groups`
      );

      // Post-process groups: split if text is followed by image, then filter invalid groups
      const processedGroups = await this.postProcessGroups(result.groups, batch);

      console.log(
        `🔧 Post-processing: ${result.groups.length} → ${processedGroups.length} groups`
      );

      // Prepare debug info
      const debugInfo: GroupingDebugInfo = {
        request: JSON.stringify(fullRequest, null, 2),
        response: JSON.stringify(response, null, 2),
        messageCount: batch.length,
        messageIds: batch.map(m => m.id),
      };

      // If there are more messages, process them too (but without debug info)
      let allGroups = processedGroups;
      if (messages.length > maxPerCall) {
        const remainingMessages = messages.slice(maxPerCall);
        const remainingGroups = await this.groupMessages(remainingMessages);
        allGroups = [...processedGroups, ...remainingGroups];
      }

      return { groups: allGroups, debugInfo };
    } catch (error) {
      console.error('❌ Error grouping messages with Groq:', error);
      return {
        groups: [],
        debugInfo: {
          request: '',
          response: '',
          messageCount: messages.length,
          messageIds: messages.map(m => m.id),
        },
      };
    }
  }

  /**
   * Validate same author - all messages must be from same sender
   */
  private validateSameAuthor(messages: any[]): boolean {
    if (messages.length < 2) return true;

    const senderIds = messages
      .map(msg => msg.senderId || msg.from)
      .filter(id => id && id !== 'unknown');

    if (senderIds.length === 0) return true; // No sender info available

    const uniqueSenders = new Set(senderIds);
    const isValid = uniqueSenders.size === 1;

    if (!isValid) {
      console.log(
        `  ❌ Author validation failed: ${uniqueSenders.size} different senders (${Array.from(uniqueSenders).join(', ')})`
      );
    }

    return isValid;
  }

  /**
   * Validate timestamp gaps - relaxed to 180 seconds for same-author messages
   * This allows valid product sequences where text and images are sent with delays
   */
  private validateTimestampGaps(messages: any[]): boolean {
    if (messages.length < 2) return true;

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt || a.timestamp).getTime() -
        new Date(b.createdAt || b.timestamp).getTime()
    );

    // Check if all messages are from same author (relaxed time window for same author)
    const senderIds = sortedMessages
      .map(msg => msg.senderId || msg.from)
      .filter(id => id && id !== 'unknown');
    const allSameAuthor = senderIds.length > 0 && new Set(senderIds).size === 1;

    // Use 180 seconds (3 minutes) for same-author, 60 seconds for different authors
    const maxGapSeconds = allSameAuthor ? 180 : 60;

    // Check time gaps between consecutive messages
    for (let i = 1; i < sortedMessages.length; i++) {
      const prevTime = new Date(
        sortedMessages[i - 1].createdAt || sortedMessages[i - 1].timestamp
      ).getTime();
      const currTime = new Date(
        sortedMessages[i].createdAt || sortedMessages[i].timestamp
      ).getTime();

      const gapSeconds = (currTime - prevTime) / 1000;

      if (gapSeconds > maxGapSeconds) {
        console.log(
          `  ❌ Timestamp gap validation failed: ${gapSeconds.toFixed(1)}s gap between messages (max ${maxGapSeconds}s allowed${allSameAuthor ? ' for same author' : ''})`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Validate sequence - relaxed to allow ITIIII patterns (2 changes) for same-author groups
   * This allows valid product patterns: Image → Text → Images (e.g., ITIIII)
   */
  private validateSequenceTypeChanges(messages: any[]): boolean {
    if (messages.length < 2) return true;

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt || a.timestamp).getTime() -
        new Date(b.createdAt || b.timestamp).getTime()
    );

    // Check if all messages are from same author (relaxed rules for same author)
    const senderIds = sortedMessages
      .map(msg => msg.senderId || msg.from)
      .filter(id => id && id !== 'unknown');
    const allSameAuthor = senderIds.length > 0 && new Set(senderIds).size === 1;

    // Create type sequence: 'T' for text, 'I' for image
    // extendedTextMessage is a text message type, count it as text even if text field is minimal
    const types = sortedMessages.map(msg => {
      // extendedTextMessage and textMessage are text message types
      const isTextMessageType =
        msg.type === 'textMessage' || msg.type === 'extendedTextMessage';
      const hasText =
        isTextMessageType ||
        (msg.text &&
          typeof msg.text === 'string' &&
          msg.text.trim().length > 0);
      const hasImage =
        msg.mediaUrl && (msg.type === 'image' || msg.type === 'imageMessage');

      if (hasText && hasImage) return 'B'; // Both
      if (hasText) return 'T';
      if (hasImage) return 'I';
      return 'N'; // Neither
    });

    // Count type changes
    let typeChanges = 0;
    for (let i = 1; i < types.length; i++) {
      if (types[i] !== types[i - 1]) {
        typeChanges++;
      }
    }

    console.log(
      `  🔍 Sequence types: ${types.join('')}, changes: ${typeChanges}`
    );

    // Check if this is a common valid pattern (IT* or TI* patterns)
    // These are natural product sequences: Image → Text → Images or Text → Images → Text
    // Patterns like ITIII, ITII, TIIIIT, IIIITI are all valid 2-change sequences
    const sequenceStr = types.join('');
    const isCommonValidPattern =
      sequenceStr.startsWith('IT') || // Image → Text → Images (ITIII, ITII, etc.)
      sequenceStr.startsWith('TI') || // Text → Images → Text (TIIIIT, etc.)
      sequenceStr.includes('ITI') || // Contains Image → Text → Image anywhere
      sequenceStr.includes('TIT') || // Contains Text → Image → Text anywhere
      /^I+TI+$/.test(sequenceStr) || // Pattern: Images → Text → Images (IIIITI, IITII, etc.)
      /^T+IT+$/.test(sequenceStr); // Pattern: Text → Images → Text

    // Allow up to 2 type changes if:
    // 1. All messages from same author, OR
    // 2. It's a common valid pattern (ITIIII, TIIIT, etc.)
    // This handles cases where author detection fails but pattern is clearly valid
    const maxChanges = allSameAuthor || isCommonValidPattern ? 2 : 1;
    const isValid = typeChanges <= maxChanges;

    if (isValid && typeChanges === 2) {
      const reason = allSameAuthor
        ? 'same-author group'
        : isCommonValidPattern
          ? 'common valid pattern (IT*/TI*)'
          : '';
      console.log(
        `  ✅ Sequence validation: ${isValid} (allowed 2 changes for ${reason})`
      );
    } else {
      console.log(`  ${isValid ? '✅' : '❌'} Sequence validation: ${isValid}`);
    }

    return isValid;
  }

  /**
   * Prepare messages for grouping analysis
   */
  private prepareMessagesForGrouping(messages: any[]): string {
    // Sort messages by timestamp to ensure chronological order
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt || a.timestamp).getTime() -
        new Date(b.createdAt || b.timestamp).getTime()
    );

    return sortedMessages
      .map((msg, index) => {
        const msgDate = new Date(msg.createdAt || msg.timestamp);
        const isoTimestamp = msgDate.toISOString();
        const localTime = msgDate.toLocaleString();

        // Calculate time gap from previous message (for reference)
        let timeGapSeconds = '';
        if (index > 0) {
          const prevDate = new Date(
            sortedMessages[index - 1].createdAt ||
              sortedMessages[index - 1].timestamp
          );
          const gapMs = msgDate.getTime() - prevDate.getTime();
          const gapSeconds = Math.round(gapMs / 1000);
          timeGapSeconds = ` (${gapSeconds}s after previous message)`;
        }

        const sender = msg.senderId || msg.from || 'unknown';
        const type = msg.type || 'unknown';
        const fullText = msg.text || '';
        // Truncate text to first 200 characters to reduce token usage
        const text = fullText.length > 200 ? fullText.substring(0, 200) + '...' : fullText;
        const mediaUrl = msg.mediaUrl || '';

        // Determine if this is a text message or image message for clarity
        const isTextMessage =
          type === 'textMessage' || type === 'extendedTextMessage';
        const isImageMessage = type === 'imageMessage' || type === 'image';
        const messageTypeLabel = isTextMessage
          ? 'TEXT'
          : isImageMessage
            ? 'IMAGE'
            : type;

        return `Message ${index + 1}:
- ID: ${msg.id}
- AUTHOR/SENDER ID: ${sender} (CRITICAL for grouping - group messages from same author)
- Timestamp (ISO): ${isoTimestamp}
- Time (Local): ${localTime}${timeGapSeconds}
- Type: ${messageTypeLabel} (${type})
- Has Text: ${isTextMessage && fullText ? 'YES' : 'NO'}
- Has Image: ${isImageMessage && mediaUrl ? 'YES' : 'NO'}
- Text Content: ${text || '(empty)'}
- Media URL: ${mediaUrl ? 'YES' : 'NO'}
---`;
      })
      .join('\n\n');
  }

  /**
   * Post-process groups: split groups where text is followed by image, then filter invalid groups
   */
  private async postProcessGroups(
    groups: MessageGroup[],
    allMessages: any[]
  ): Promise<MessageGroup[]> {
    const messageMap = new Map(allMessages.map(m => [m.id, m]));
    const splitGroups: MessageGroup[] = [];

    for (const group of groups) {
      const groupMessages = group.messageIds
        .map(id => messageMap.get(id))
        .filter(Boolean) as any[];

      if (groupMessages.length === 0) continue;

      // Sort messages by timestamp
      const sortedMessages = [...groupMessages].sort(
        (a, b) =>
          new Date(a.createdAt || a.timestamp).getTime() -
          new Date(b.createdAt || b.timestamp).getTime()
      );

      // Determine message types: 'T' for text, 'I' for image
      const messageTypes = sortedMessages.map(msg => {
        const isTextMessageType =
          msg.type === 'textMessage' || msg.type === 'extendedTextMessage';
        const hasText =
          isTextMessageType ||
          (msg.text &&
            typeof msg.text === 'string' &&
            msg.text.trim().length > 0);
        const hasImage =
          msg.mediaUrl && (msg.type === 'image' || msg.type === 'imageMessage');

        if (hasText && hasImage) return 'B'; // Both
        if (hasText) return 'T';
        if (hasImage) return 'I';
        return 'N'; // Neither
      });

      const sequenceStr = messageTypes.join('');
      console.log(
        `  🔍 Processing group ${group.groupId}: sequence=${sequenceStr}, messages=${sortedMessages.length}`
      );

      // Check if group has the pattern "images → text" (IT, IIT, IIIIIT, etc.)
      // This means we should look for I (or B) followed by T (or B) somewhere in the sequence
      // TI should NOT be split (no I before T)
      let hasImageThenTextPattern = false;
      for (let i = 0; i < messageTypes.length - 1; i++) {
        if (
          (messageTypes[i] === 'I' || messageTypes[i] === 'B') &&
          (messageTypes[i + 1] === 'T' || messageTypes[i + 1] === 'B')
        ) {
          hasImageThenTextPattern = true;
          break;
        }
      }

      // Only split if group has the "images → text" pattern
      if (!hasImageThenTextPattern) {
        console.log(
          `     - No "images → text" pattern found, keeping original group`
        );
        splitGroups.push(group);
        continue;
      }

      console.log(
        `     - Has "images → text" pattern, checking for split points`
      );

      // Find split points: where text is followed by image (T → I)
      // Examples: IITI -> split after T, ITI -> split after T, IIIIITI -> split after T
      const splitPoints: number[] = [];
      for (let i = 0; i < messageTypes.length - 1; i++) {
        const current = messageTypes[i];
        const next = messageTypes[i + 1];

        // Split if text is followed by image (T → I)
        if ((current === 'T' || current === 'B') && next === 'I') {
          splitPoints.push(i + 1); // Split after current message
          console.log(
            `     - Found split point at index ${i + 1} (${current} → ${next})`
          );
        }
      }

      // If no split points, keep original group
      if (splitPoints.length === 0) {
        console.log(`     - No split points found, keeping original group`);
        splitGroups.push(group);
        continue;
      }

      console.log(
        `     - Splitting into ${splitPoints.length + 1} groups at positions: ${splitPoints.join(', ')}`
      );

      // Create new groups based on split points
      let startIdx = 0;
      let splitCount = 0;
      for (const splitIdx of splitPoints) {
        // Create group from startIdx to splitIdx (exclusive)
        const newGroupMessageIds = sortedMessages
          .slice(startIdx, splitIdx)
          .map(m => m.id);

        if (newGroupMessageIds.length > 0) {
          const newGroupSequence = messageTypes
            .slice(startIdx, splitIdx)
            .join('');
          splitGroups.push({
            groupId: `${group.groupId}-split-${splitCount}`,
            messageIds: newGroupMessageIds,
            productContext: group.productContext,
            confidence: group.confidence,
          });
          console.log(
            `     - Created split group ${group.groupId}-split-${splitCount}: sequence=${newGroupSequence}, messages=${newGroupMessageIds.length}`
          );
          splitCount++;
        }

        startIdx = splitIdx;
      }

      // Add remaining messages after last split
      if (startIdx < sortedMessages.length) {
        const remainingMessageIds = sortedMessages
          .slice(startIdx)
          .map(m => m.id);

        if (remainingMessageIds.length > 0) {
          const remainingSequence = messageTypes.slice(startIdx).join('');
          splitGroups.push({
            groupId: `${group.groupId}-split-${splitCount}`,
            messageIds: remainingMessageIds,
            productContext: group.productContext,
            confidence: group.confidence,
          });
          console.log(
            `     - Created split group ${group.groupId}-split-${splitCount}: sequence=${remainingSequence}, messages=${remainingMessageIds.length}`
          );
        }
      }
    }

    // Filter: only keep groups that have both text and images
    const validGroups: MessageGroup[] = [];
    for (const group of splitGroups) {
      const groupMessages = group.messageIds
        .map(id => messageMap.get(id))
        .filter(Boolean) as any[];

      if (groupMessages.length === 0) {
        console.log(
          `  🗑️ Filtering out group ${group.groupId}: no messages found`
        );
        continue;
      }

      // Sort messages by timestamp for logging
      const sortedGroupMessages = [...groupMessages].sort(
        (a, b) =>
          new Date(a.createdAt || a.timestamp).getTime() -
          new Date(b.createdAt || b.timestamp).getTime()
      );

      // Determine message types for logging
      const messageTypes = sortedGroupMessages.map(msg => {
        const isTextMessageType =
          msg.type === 'textMessage' || msg.type === 'extendedTextMessage';
        const hasText =
          isTextMessageType ||
          (msg.text &&
            typeof msg.text === 'string' &&
            msg.text.trim().length > 0);
        const hasImage =
          msg.mediaUrl && (msg.type === 'image' || msg.type === 'imageMessage');

        if (hasText && hasImage) return 'B'; // Both
        if (hasText) return 'T';
        if (hasImage) return 'I';
        return 'N'; // Neither
      });

      // Check for text messages
      const textMessages = sortedGroupMessages.filter((msg: any) => {
        const isTextMessageType =
          msg.type === 'textMessage' || msg.type === 'extendedTextMessage';
        const hasTextContent =
          isTextMessageType ||
          (msg.text &&
            typeof msg.text === 'string' &&
            msg.text.trim().length > 0);
        return hasTextContent;
      });

      // Check for image messages
      const imageMessages = sortedGroupMessages.filter(
        (msg: any) =>
          msg.mediaUrl && (msg.type === 'image' || msg.type === 'imageMessage')
      );

      let hasText = textMessages.length > 0;
      const hasImage = imageMessages.length > 0;

      // If group has images but no text, try to find nearby text messages
      if (hasImage && !hasText && sortedGroupMessages.length > 0) {
        const recoveredGroup = await this.recoverTextForImageGroup(
          sortedGroupMessages,
          messageMap
        );
        if (recoveredGroup) {
          // Update the group with recovered messages
          group.messageIds = recoveredGroup.messageIds;
          const recoveredTextMessages = recoveredGroup.messageIds
            .map(id => messageMap.get(id))
            .filter(Boolean)
            .filter((msg: any) => {
              const isTextMessageType =
                msg.type === 'textMessage' || msg.type === 'extendedTextMessage';
              return (
                isTextMessageType ||
                (msg.text &&
                  typeof msg.text === 'string' &&
                  msg.text.trim().length > 0)
              );
            });
          console.log(
            `  🔄 Recovered ${recoveredTextMessages.length} text messages for image-only group ${group.groupId}`
          );
          // Re-check validity after recovery
          hasText = recoveredTextMessages.length > 0;
        }
      }

      // Valid group must have both text and images
      const isValid = hasText && hasImage;

      // Log detailed information
      if (!isValid) {
        console.log(`  🗑️ Filtering out group ${group.groupId}:`);
        console.log(`     - Message count: ${sortedGroupMessages.length}`);
        console.log(`     - Sequence: ${messageTypes.join('')}`);
        console.log(
          `     - Text messages: ${textMessages.length} (hasText=${hasText})`
        );
        console.log(
          `     - Image messages: ${imageMessages.length} (hasImage=${hasImage})`
        );
        console.log(
          `     - Message types: ${sortedGroupMessages.map(m => m.type).join(', ')}`
        );
        console.log(
          `     - Message IDs: ${group.messageIds.slice(0, 5).join(', ')}${group.messageIds.length > 5 ? '...' : ''}`
        );
      } else {
        console.log(
          `  ✅ Keeping group ${group.groupId}: sequence=${messageTypes.join('')}, text=${textMessages.length}, images=${imageMessages.length}`
        );
        validGroups.push(group);
      }
    }

    return validGroups;
  }

  /**
   * Recover text messages for image-only groups by finding nearby text messages
   */
  private async recoverTextForImageGroup(
    imageMessages: any[],
    messageMap: Map<string, any>
  ): Promise<{ messageIds: string[] } | null> {
    if (imageMessages.length === 0) return null;

    // Get time range (first and last image timestamps)
    const firstTimestamp = new Date(
      imageMessages[0].createdAt || imageMessages[0].timestamp
    ).getTime();
    const lastTimestamp = new Date(
      imageMessages[imageMessages.length - 1].createdAt ||
        imageMessages[imageMessages.length - 1].timestamp
    ).getTime();

    // Get author and chat from first message
    const author = imageMessages[0].from || imageMessages[0].senderId;
    const chatId = imageMessages[0].chatId;
    if (!author || !chatId) return null;

    // Search for text messages within 120 seconds before first image or after last image
    const searchWindowMs = 120 * 1000; // 120 seconds
    const searchStart = new Date(firstTimestamp - searchWindowMs);
    const searchEnd = new Date(lastTimestamp + searchWindowMs);

    // Get all message IDs already in this group
    const existingMessageIds = imageMessages.map((m: any) => m.id);

    // Find text messages from same author in the time window
    const textMessages = await prisma.whatsAppMessage.findMany({
      where: {
        chatId: chatId,
        id: { notIn: existingMessageIds }, // Don't include already grouped messages
        processed: false, // Only unprocessed messages
        type: { in: ['textMessage', 'extendedTextMessage'] },
        text: { not: null },
        from: author,
        createdAt: {
          gte: searchStart,
          lte: searchEnd,
        },
      },
      select: { id: true, text: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 3, // Limit to 3 closest text messages
    });

    if (textMessages.length === 0) {
      return null;
    }

    // Filter to messages that actually have text content
    const validTextMessages = textMessages.filter(
      (msg: any) => msg.text && msg.text.trim().length > 0
    );

    if (validTextMessages.length === 0) {
      return null;
    }

    // Add recovered text messages to message map
    for (const msg of validTextMessages) {
      const fullMessage = await prisma.whatsAppMessage.findUnique({
        where: { id: msg.id },
      });
      if (fullMessage) {
        messageMap.set(msg.id, fullMessage);
      }
    }

    // Return original image IDs + recovered text message IDs
    return {
      messageIds: [
        ...existingMessageIds,
        ...validTextMessages.map((m: any) => m.id),
      ],
    };
  }

  /**
   * Store grouping debug information for later analysis
   */
  private async storeGroupingDebugInfo(
    messages: any[],
    request: any,
    response: any
  ): Promise<void> {
    try {
      // Create a debug record for this grouping session
      const debugData = {
        messageCount: messages.length,
        messageIds: messages.map(m => m.id),
        request: JSON.stringify(request, null, 2),
        response: JSON.stringify(response, null, 2),
        timestamp: new Date().toISOString(),
      };

      console.log(
        `🔍 Stored grouping debug info for ${messages.length} messages`
      );

      // Store in a temporary table or log file for now
      // TODO: Create a proper debug table if needed
      console.log('Debug data:', JSON.stringify(debugData, null, 2));
    } catch (error) {
      console.error('❌ Error storing grouping debug info:', error);
    }
  }
}
