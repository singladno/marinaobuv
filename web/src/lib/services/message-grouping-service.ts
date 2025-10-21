import { prisma } from '../db-node';
import { env } from '../env';
import OpenAI from 'openai';
import { createGroupingPrompt } from '../gpt-grouping-prompt';
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
   * Only treat real text messages as text. Image captions are NOT text.
   */
  private getNormalizedText(msg: any): string | null {
    // Accept explicit text messages and extendedTextMessage with non-empty `text`
    if (
      (msg?.type === 'text' ||
        msg?.type === 'textMessage' ||
        msg?.type === 'extendedTextMessage') &&
      typeof msg?.text === 'string'
    ) {
      const trimmed = msg.text.trim();
      if (trimmed && trimmed.toLowerCase() !== 'null') return trimmed;
    }
    return null;
  }

  /**
   * Validate sequence - only one type change allowed per group
   * Example: images-text-text-images = INVALID (2 changes)
   * Example: images-text-text = VALID (1 change)
   */
  private validateSequenceTypeChanges(messages: any[]): boolean {
    if (messages.length < 2) return true;

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt || a.timestamp).getTime() -
        new Date(b.createdAt || b.timestamp).getTime()
    );

    // Create type sequence: 'T' for text, 'I' for image
    const types = sortedMessages.map(msg => {
      const hasText = this.getNormalizedText(msg) !== null;
      const hasImage =
        msg.mediaUrl && (msg.type === 'image' || msg.type === 'imageMessage');

      if (hasText && hasImage) return 'B'; // Both (treat as text+image)
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

    // Only allow 0 or 1 type change
    const isValid = typeChanges <= 1;
    console.log(`  ${isValid ? '✅' : '❌'} Sequence validation: ${isValid}`);

    return isValid;
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
    // Build sender/time-aware segments to avoid splitting related sequences across batches
    const maxPerCall = env.PROCESSING_BATCH_SIZE || 100;
    const timeGapSeconds = 60; // treat >60s gap as boundary between sequences

    // Ensure chronological order (already asc by createdAt at fetch)
    const segments: (typeof messagesForGPT)[] = [] as any;
    let currentSegment: typeof messagesForGPT = [] as any;
    for (let i = 0; i < messagesForGPT.length; i++) {
      const curr = messagesForGPT[i];
      const prev = i > 0 ? messagesForGPT[i - 1] : null;
      const isBoundary =
        !prev ||
        curr.sender !== prev.sender ||
        (new Date(curr.timestamp).getTime() -
          new Date(prev.timestamp).getTime()) /
          1000 >
          timeGapSeconds;
      if (isBoundary && currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [] as any;
      }
      currentSegment.push(curr);
    }
    if (currentSegment.length > 0) segments.push(currentSegment);

    // Pack segments into batches without splitting a segment
    const batches: (typeof messagesForGPT)[] = [] as any;
    let batch: typeof messagesForGPT = [] as any;
    for (const seg of segments) {
      if (batch.length + seg.length > maxPerCall && batch.length > 0) {
        batches.push(batch);
        batch = [] as any;
      }
      // If a single segment is larger than maxPerCall, still keep it intact in its own batch
      if (seg.length > maxPerCall) {
        batches.push(seg);
      } else {
        batch.push(...seg);
      }
    }
    if (batch.length > 0) batches.push(batch);

    try {
      const allGroups: MessageGroup[] = [];
      for (let b = 0; b < batches.length; b++) {
        const prompt = createGroupingPrompt(batches[b]);

        console.log(
          `📝 Prompt for batch ${b + 1}/${batches.length} (first 1000 chars):`
        );
        console.log(
          `   ${prompt.substring(0, 1000)}${prompt.length > 1000 ? '...' : ''}`
        );

        // Add rate limiting delay before grouping request
        const delayMs = parseInt(env.OPENAI_REQUEST_DELAY_MS || '2000');
        console.log(
          `⏳ Rate limiting: waiting ${delayMs}ms before grouping request (batch ${b + 1}/${batches.length})...`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));

        console.log(`🔍 Sending request to OpenAI GPT-5 Responses API...`);
        console.log(
          `   Model: ${ModelConfigService.getModelForTask('grouping')}`
        );
        console.log(
          `   Reasoning effort: ${ModelConfigService.getReasoningEffortForTask('grouping')}`
        );
        console.log(
          `   Text verbosity: ${ModelConfigService.getTextVerbosityForTask('grouping')}`
        );
        console.log(
          `   Max output tokens: ${ModelConfigService.getMaxOutputTokensForTask('grouping')}`
        );
        console.log(`   Messages in batch: ${batches[b].length}`);

        const model = ModelConfigService.getModelForTask('grouping');
        const payload: any = {
          model,
          input: prompt,
          max_output_tokens:
            ModelConfigService.getMaxOutputTokensForTask('grouping'),
        };
        if (ModelConfigService.supportsReasoning(model)) {
          payload.reasoning = {
            effort: ModelConfigService.getReasoningEffortForTask('grouping'),
          };
        }
        if (ModelConfigService.supportsTextControls(model)) {
          payload.text = {
            verbosity: ModelConfigService.getTextVerbosityForTask('grouping'),
          };
        }

        const response = await this.openai.responses.create(payload);

        console.log(`📥 Received response from OpenAI GPT-5 API`);
        console.log(`   Usage: ${JSON.stringify(response.usage)}`);
        console.log(`   Finish reason: ${response.finish_reason}`);

        const content = response.output_text;
        if (!content) {
          throw new Error('No content in OpenAI response');
        }

        console.log(`📄 Raw response content (first 500 chars):`);
        console.log(
          `   ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`
        );

        let cleanedContent = content.trim();
        if (cleanedContent.includes('```json')) {
          const jsonMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) cleanedContent = jsonMatch[1].trim();
        } else if (cleanedContent.includes('```')) {
          const jsonMatch = cleanedContent.match(/```\s*([\s\S]*?)\s*```/);
          if (jsonMatch) cleanedContent = jsonMatch[1].trim();
        }

        console.log(`🧹 Cleaned content (first 500 chars):`);
        console.log(
          `   ${cleanedContent.substring(0, 500)}${cleanedContent.length > 500 ? '...' : ''}`
        );

        if (
          !cleanedContent.startsWith('{') &&
          !cleanedContent.startsWith('[')
        ) {
          throw new Error('Response does not appear to be valid JSON');
        }

        const parsed = JSON.parse(cleanedContent);
        console.log(`🔍 Parsed JSON structure:`, Object.keys(parsed));
        let groups = (parsed.groups || []) as MessageGroup[];
        console.log(`📊 Found ${groups.length} groups in parsed response`);

        // Post-filter: drop any groups that don't contain BOTH at least one text message AND one image message
        if (groups.length > 0) {
          console.log(`🔍 Post-filtering ${groups.length} groups...`);
          const messageById = new Map(messages.map((m: any) => [m.id, m]));
          const originalCount = groups.length;
          groups = groups.filter(group => {
            const groupMessages = (group.messageIds || [])
              .map(id => messageById.get(id))
              .filter(Boolean) as any[];

            // Check if the GROUP has both text and image messages (separate messages are fine)
            const hasImageMessages = groupMessages.some(
              (m: any) =>
                (m.type === 'image' || m.type === 'imageMessage') &&
                !!m.mediaUrl
            );
            const hasTextMessages = groupMessages.some((m: any) => {
              const t = this.getNormalizedText(m);
              return !!t;
            });
            // CRITICAL: Validate sequence - only one type change allowed
            const isValidSequence =
              this.validateSequenceTypeChanges(groupMessages);

            const passesFilter =
              hasImageMessages && hasTextMessages && isValidSequence;
            console.log(
              `   Group ${group.groupId}: ${groupMessages.length} messages, hasImageMessages: ${hasImageMessages}, hasTextMessages: ${hasTextMessages}, validSequence: ${isValidSequence}, passes: ${passesFilter}`
            );
            return passesFilter;
          });
          console.log(
            `🔍 Post-filtering complete: ${originalCount} → ${groups.length} groups`
          );
        }
        console.log(
          `✅ OpenAI identified ${groups.length} product groups in batch ${b + 1}/${batches.length}`
        );
        allGroups.push(...groups);
      }

      // Detailed logs
      for (let i = 0; i < allGroups.length; i++) {
        const group = allGroups[i];
        console.log(
          `\n📦 Group ${i + 1}/${allGroups.length}: ${group.groupId}`
        );
        console.log(`   📝 Context: ${group.productContext}`);
        console.log(`   📊 Confidence: ${group.confidence}`);
        console.log(`   📨 Messages (${group.messageIds.length}):`);
        const groupMessages = messages.filter((msg: any) =>
          group.messageIds.includes(msg.id)
        );
        for (const msg of groupMessages) {
          const messageType = (msg as any).type || 'text';
          const hasImage =
            ((msg as any).type === 'image' ||
              (msg as any).type === 'imageMessage') &&
            !!(msg as any).mediaUrl;
          const hasText = (msg as any).text && (msg as any).text.trim();
          const sender =
            (msg as any).fromName || (msg as any).from || 'Unknown';
          console.log(
            `     ${messageType} from ${sender}${hasImage ? ' (with media)' : ''}${hasText ? ' (with text)' : ''}`
          );
        }
      }

      return allGroups;
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
      text: msg.text && msg.text !== 'null' && msg.text.trim() ? msg.text : '',
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
