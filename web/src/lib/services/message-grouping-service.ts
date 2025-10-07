import { prisma } from '../db-node';
import { env } from '../env';
import OpenAI from 'openai';
import { createGroupingPrompt } from '../prompts/grouping-prompt';
import { GreenApiFetcher } from '../green-api-fetcher';
import { ModelConfigService } from './model-config-service';

export interface MessageGroup {
  groupId: string;
  messageIds: string[];
  productContext: string;
  confidence: number;
}

/**
 * Service for grouping WhatsApp messages using OpenAI
 */
export class MessageGroupingService {
  private openai: any;
  private greenApiFetcher: GreenApiFetcher;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.openai = null;
    this.greenApiFetcher = new GreenApiFetcher();
  }

  private async ensureClient() {
    if (this.openai) return;
    const rawBase = env.OPENAI_BASE_URL || 'https://api.openai.com';
    const normalizedBase = rawBase.endsWith('/v1')
      ? rawBase
      : `${rawBase.replace(/\/+$/, '')}/v1`;
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: normalizedBase,
    });
  }

  /**
   * Group messages using OpenAI analysis
   */
  async groupMessages(messageIds: string[]): Promise<MessageGroup[]> {
    await this.ensureClient();
    console.log(
      `📊 Step 1: Grouping ${messageIds.length} messages with OpenAI...`
    );

    const messages = await this.fetchMessages(messageIds);
    if (messages.length === 0) {
      console.log('⚠️  No messages found for grouping');
      return [];
    }

    // Refresh media URLs for image messages before grouping
    await this.refreshMediaUrls(messages);

    const messagesForGPT = this.prepareMessagesForGPT(messages);
    const prompt = createGroupingPrompt(messagesForGPT);

    try {
      const response = await this.openai.chat.completions.create({
        model: ModelConfigService.getModelForTask('grouping'),
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at analyzing WhatsApp messages to group them by product. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: ModelConfigService.getTemperatureForTask('grouping'),
        max_tokens: ModelConfigService.getMaxTokensForTask('grouping'),
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const result = JSON.parse(content);
      const groups = result.groups || [];

      console.log(`✅ OpenAI identified ${groups.length} product groups`);

      // Log detailed information about each group
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        console.log(`\n📦 Group ${i + 1}/${groups.length}: ${group.groupId}`);
        console.log(`   📝 Context: ${group.productContext}`);
        console.log(`   📊 Confidence: ${group.confidence}`);
        console.log(`   📨 Messages (${group.messageIds.length}):`);

        // Get message details for this group
        const groupMessages = messages.filter(msg =>
          group.messageIds.includes(msg.id)
        );
        for (const msg of groupMessages) {
          const messageType = msg.type || 'text';
          const hasImage =
            (msg.type === 'image' || msg.type === 'imageMessage') &&
            !!msg.mediaUrl;
          const hasText = msg.text && msg.text.trim();
          const sender = msg.fromName || msg.from || 'Unknown';

          console.log(
            `     ${messageType} from ${sender}${hasImage ? ' (with media)' : ''}${hasText ? ' (with text)' : ''}`
          );
        }
      }

      return groups;
    } catch (error) {
      console.error('❌ Error grouping messages with OpenAI:', error);
      return [];
    }
  }

  /**
   * Fetch messages from database
   */
  private async fetchMessages(messageIds: string[]) {
    return await prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Prepare messages for GPT analysis
   */
  private prepareMessagesForGPT(messages: any[]) {
    return messages.map((msg, index) => ({
      id: msg.id,
      index: index + 1,
      sender: msg.fromName || msg.from || 'Unknown',
      type: msg.type || 'text',
      text: msg.text || '',
      hasImage:
        (msg.type === 'image' || msg.type === 'imageMessage') && !!msg.mediaUrl,
      imageUrl: msg.mediaUrl,
      timestamp: msg.createdAt.toISOString(),
      timeAgo: this.getTimeAgo(msg.createdAt, messages[0].createdAt),
    }));
  }

  /**
   * Get time ago string for message
   */
  private getTimeAgo(messageTime: Date, firstMessageTime: Date): string {
    const diffMs = messageTime.getTime() - firstMessageTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return '0 minutes ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }

  /**
   * Refresh media URLs for image messages that have null mediaUrl
   */
  private async refreshMediaUrls(messages: any[]): Promise<void> {
    const imageMessages = messages.filter(
      msg =>
        (msg.type === 'image' || msg.type === 'imageMessage') && !msg.mediaUrl
    );

    if (imageMessages.length === 0) {
      return;
    }

    console.log(
      `🔄 Refreshing media URLs for ${imageMessages.length} image messages...`
    );

    // Process with limited concurrency to speed up while avoiding rate limits
    const concurrency = env.MEDIA_REFRESH_CONCURRENCY || 5;
    let index = 0;

    const worker = async () => {
      while (index < imageMessages.length) {
        const current = index++;
        const message = imageMessages[current];
        try {
          console.log(
            `   📸 Refreshing media URL for message ${message.id} (${current + 1}/${imageMessages.length})...`
          );

          const freshUrl = await this.greenApiFetcher.downloadFile(
            message.waMessageId,
            message.chatId || ''
          );

          if (freshUrl) {
            await prisma.whatsAppMessage.update({
              where: { id: message.id },
              data: { mediaUrl: freshUrl },
            });
            message.mediaUrl = freshUrl;
            console.log(`   ✅ Refreshed media URL for message ${message.id}`);
          } else {
            console.log(
              `   ⚠️  Could not refresh media URL for message ${message.id}`
            );
          }
        } catch (error) {
          console.error(
            `   ❌ Error refreshing media URL for message ${message.id}:`,
            error
          );
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, imageMessages.length) },
      () => worker()
    );
    await Promise.all(workers);
  }
}
