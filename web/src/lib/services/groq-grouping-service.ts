import Groq from 'groq-sdk';
import { prisma } from '../db-node';
import { getGroqConfig } from '../groq-proxy-config';
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

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is required');
    }
  }

  private async initializeGroq(): Promise<Groq> {
    if (!this.groq) {
      const config = await getGroqConfig();
      this.groq = new Groq(config);
    }
    return this.groq;
  }

  /**
   * Group messages using Groq
   */
  async groupMessages(messages: any[]): Promise<MessageGroup[]> {
    if (messages.length === 0) return [];

    try {
      console.log(
        `📊 Grouping ${messages.length} messages with Groq (Llama-4 Maverick 17B 128E)...`
      );

      // Prepare messages for grouping
      const messagesText = this.prepareMessagesForGrouping(messages);

      // Prepare the full request for debugging
      const fullRequest = {
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
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

      const result = JSON.parse(response.choices[0].message.content || '{}');

      if (!result.groups || !Array.isArray(result.groups)) {
        console.log('❌ Invalid grouping response from Groq');
        return [];
      }

      console.log(
        `✅ Groq grouped messages into ${result.groups.length} groups`
      );
      console.log(
        `📊 From ${messages.length} messages ${result.groups.length} groups detected`
      );

      // Trust LLM - all groups are valid
      console.log(
        `✅ Accepting all ${result.groups.length} groups from LLM (no manual validation)`
      );

      // Store the request and response for debugging
      await this.storeGroupingDebugInfo(messages, fullRequest, response);

      return result.groups;
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

    try {
      console.log(
        `📊 Grouping ${messages.length} messages with Groq (Llama-4 Maverick 17B 128E)...`
      );

      // Prepare messages for grouping
      const messagesText = this.prepareMessagesForGrouping(messages);

      // Prepare the full request for debugging
      const fullRequest = {
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
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

      const result = JSON.parse(response.choices[0].message.content || '{}');

      if (!result.groups || !Array.isArray(result.groups)) {
        console.log('❌ Invalid grouping response from Groq');
        return {
          groups: [],
          debugInfo: {
            request: JSON.stringify(fullRequest, null, 2),
            response: JSON.stringify(response, null, 2),
            messageCount: messages.length,
            messageIds: messages.map(m => m.id),
          },
        };
      }

      console.log(
        `✅ Groq grouped messages into ${result.groups.length} groups`
      );
      console.log(
        `📊 From ${messages.length} messages ${result.groups.length} groups detected`
      );

      // Trust LLM - all groups are valid
      console.log(
        `✅ Accepting all ${result.groups.length} groups from LLM (no manual validation)`
      );

      // Prepare debug info
      const debugInfo: GroupingDebugInfo = {
        request: JSON.stringify(fullRequest, null, 2),
        response: JSON.stringify(response, null, 2),
        messageCount: messages.length,
        messageIds: messages.map(m => m.id),
      };

      return { groups: result.groups, debugInfo };
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
        const text = msg.text || '';
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
- Has Text: ${isTextMessage && text ? 'YES' : 'NO'}
- Has Image: ${isImageMessage && mediaUrl ? 'YES' : 'NO'}
- Text Content: ${text || '(empty)'}
- Media URL: ${mediaUrl || '(none)'}
---`;
      })
      .join('\n\n');
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
