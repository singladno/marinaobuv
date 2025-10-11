import Groq from 'groq-sdk';
import { prisma } from '../db-node';
import { getGroqConfig } from '../groq-proxy-config';

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
            content: `You are an expert at analyzing WhatsApp messages to identify product sequences.

GROUP MESSAGES BY PRODUCT:

CORE REQUIREMENTS:
- Each group MUST have: 1+ text message + 1+ image
- Messages from same product come in sequence from same user
- Skip incomplete groups (images only or text only)
- MAXIMUM 10 messages per group (typically 4-8 messages per product)

PRODUCT SEQUENCE DETECTION (CRITICAL):
A product sequence is: [Text] → [Images] = ONE PRODUCT
OR [Images] → [Text] = ONE PRODUCT
If you see: [Text] → [Images] → [Text] → [Images] = TWO SEPARATE PRODUCTS
OR [Images] → [Text] → [Images] → [Text] = TWO SEPARATE PRODUCTS

COMMON PATTERNS:
1. Single product: [Text] → [Image] (4-6 messages)
2. Multiple products: [Text] → [Image] → [Text] → [Image] (6+ messages = 2 products)
3. Mixed pattern: [Text] → [Text] → [Image] → [Image] → [Text] → [Image] (6+ messages = 2 products)

STRICT GROUPING RULES:
- EVERY group MUST contain BOTH images AND text messages — this is MANDATORY
- Groups with ONLY images are INVALID — they must be skipped entirely
- Groups with ONLY text are INVALID — they must be skipped entirely
- MAXIMUM 10 messages per group (enforced strictly)
- A group can have 1-3 text messages describing the same product
- A group can have 1-5 images of the same product
- Use timestamp field: messages sent within 1-2 seconds are usually same product
- Time gaps of 30+ seconds often indicate different products
- Look for natural breaks in message flow and topic changes
- Different products from same sender should be separate groups
- Provider greetings go with the NEXT product messages

SEQUENCE VALIDATION:
- If you see text+images pattern, create separate groups
- Each group should represent ONE complete product sequence
- When in doubt, create MORE groups rather than fewer
- Skip incomplete sequences (missing text or images)

Return JSON format:
{
  "groups": [
    {
      "groupId": "group_1",
      "messageIds": ["msg_id_1", "msg_id_4"],
      "productContext": "Brief description of the product",
      "confidence": 0.9
    }
  ]
}

VALIDATION RULES:
- Each group MUST have 2-6 messages. Rarely 7-10 messages.
- Each group MUST have both text and image messages
- If a group has >10 messages, analyze timestamps and split into multiple groups if needed
- If you see text+images+text+images pattern, create separate groups
- Each group represents ONE complete product sequence`,
          },
          {
            role: 'user',
            content: `Analyze these WhatsApp messages and group them by product:

${messagesText}`,
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

        return `Message ${index + 1}:
- ID: ${msg.id}
- Time: ${timestamp}
- Sender: ${sender}
- Type: ${type}
- Text: ${text}
---`;
      })
      .join('\n\n');
  }
}
