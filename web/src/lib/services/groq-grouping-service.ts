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
        `📊 Grouping ${messages.length} messages with Groq (Llama-4 Maverick 17B)...`
      );

      // Prepare messages for grouping
      const messagesText = this.prepareMessagesForGrouping(messages);

      // Prepare the full request for debugging
      const fullRequest = {
        model: 'llama-3.1-8b-instant',
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
        `📊 Grouping ${messages.length} messages with Groq (Llama-4 Maverick 17B)...`
      );

      // Prepare messages for grouping
      const messagesText = this.prepareMessagesForGrouping(messages);

      // Prepare the full request for debugging
      const fullRequest = {
        model: 'llama-3.1-8b-instant',
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
   * Prepare messages for grouping analysis
   */
  private prepareMessagesForGrouping(messages: any[]): string {
    return messages
      .map((msg, index) => {
        const timestamp = new Date(msg.createdAt).toLocaleString();
        const sender = msg.senderId || 'unknown';
        const type = msg.type || 'unknown';
        const text = msg.text || '';
        const mediaUrl = msg.mediaUrl || '';

        return `Message ${index + 1}:
- ID: ${msg.id}
- Time: ${timestamp}
- Sender: ${sender}
- Type: ${type}
- Text: ${text}
- Media: ${mediaUrl ? 'YES' : 'NO'}
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
