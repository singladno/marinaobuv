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

/**
 * Service for grouping WhatsApp messages using Groq
 */
export class GroqGroupingService {
  private groq: Groq;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is required');
    }
    this.groq = new Groq(getGroqConfig());
  }

  /**
   * Group messages using Groq
   */
  async groupMessages(messages: any[]): Promise<MessageGroup[]> {
    if (messages.length === 0) return [];

    try {
      console.log(`📊 Grouping ${messages.length} messages with Groq...`);

      // Prepare messages for grouping
      const messagesText = this.prepareMessagesForGrouping(messages);

      const response = await this.groq.chat.completions.create({
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
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      if (!result.groups || !Array.isArray(result.groups)) {
        console.log('❌ Invalid grouping response from Groq');
        return [];
      }

      console.log(
        `✅ Groq grouped messages into ${result.groups.length} groups`
      );
      return result.groups;
    } catch (error) {
      console.error('❌ Error grouping messages with Groq:', error);
      return [];
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
}
