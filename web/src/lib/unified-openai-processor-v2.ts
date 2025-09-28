import { prisma } from './db-node';
import { ImageProcessingService } from './services/image-processing-service';
import {
  MessageGroupingService,
  MessageGroup,
} from './services/message-grouping-service';
import { ProductCreationService } from './services/product-creation-service';
import { UnifiedAnalysisService } from './services/unified-analysis-service';

/**
 * Refactored unified OpenAI processor with clean separation of concerns
 */
export class UnifiedOpenAIProcessor {
  private groupingService: MessageGroupingService;
  private analysisService: UnifiedAnalysisService;
  private imageService: ImageProcessingService;
  private productService: ProductCreationService;

  constructor() {
    this.groupingService = new MessageGroupingService();
    this.analysisService = new UnifiedAnalysisService();
    this.imageService = new ImageProcessingService();
    this.productService = new ProductCreationService();
  }

  /**
   * Main processing function - clean and readable
   */
  async processMessagesToProducts(messageIds: string[]): Promise<void> {
    console.log(
      `🚀 Processing ${messageIds.length} messages with unified OpenAI approach...`
    );

    // Step 1: Group messages using OpenAI
    const messageGroups = await this.groupingService.groupMessages(messageIds);

    if (messageGroups.length === 0) {
      console.log(
        `⚠️  No product groups found. Messages may not contain valid product information.`
      );
      return;
    }

    console.log(
      `📊 Step 2: Processing each group with unified OpenAI analysis...`
    );

    // Step 2: Process each group
    for (let i = 0; i < messageGroups.length; i++) {
      const group = messageGroups[i];
      await this.processGroup(group, i + 1, messageGroups.length);
    }

    console.log(
      `\n🎉 Processing complete! Processed ${messageGroups.length} product groups.`
    );
  }

  /**
   * Process a single message group
   */
  private async processGroup(
    group: MessageGroup,
    index: number,
    total: number
  ): Promise<void> {
    console.log(`\n🔄 Processing group ${index}/${total}: ${group.groupId}`);
    console.log(`   📝 Context: ${group.productContext}`);
    console.log(`   📊 Confidence: ${group.confidence}`);
    console.log(`   📨 Messages: ${group.messageIds.length}`);

    try {
      // Fetch messages for this group
      const messages = await this.fetchGroupMessages(group.messageIds);
      if (messages.length === 0) {
        console.log(`   ⚠️  No messages found for group ${group.groupId}`);
        return;
      }

      // Check if already processed
      if (await this.isGroupAlreadyProcessed(group.messageIds)) {
        console.log(
          `   ⏭️  Draft products already exist for group ${group.groupId}`
        );
        return;
      }

      // Extract text content first
      const textContents = this.extractTextContent(messages);
      console.log(`   📝 Found ${textContents.length} text messages`);

      // Get image URLs from messages (don't upload to S3 yet)
      const imageUrls = messages
        .filter(msg => msg.type === 'image' && msg.mediaUrl)
        .map(msg => msg.mediaUrl!);
      console.log(`   📸 Found ${imageUrls.length} images to analyze`);

      if (textContents.length === 0 && imageUrls.length === 0) {
        console.log(
          `   ⚠️  No text content or images found in group ${group.groupId}`
        );
        return;
      }

      // Analyze with OpenAI using original WhatsApp URLs
      console.log(`   🤖 Analyzing with OpenAI...`);
      const analysisResult = await this.analysisService.analyzeTextAndImages(
        textContents.join('\n\n'),
        imageUrls,
        group.productContext
      );

      if (!analysisResult) {
        console.log(`   ❌ Failed to analyze group ${group.groupId}`);
        return;
      }

      console.log(`   ✅ LLM analysis successful, validation passed!`);
      console.log(`   🖼️  Now uploading images to S3...`);

      // Only upload to S3 after successful validation
      const imageData =
        await this.imageService.processImagesFromMessages(messages);
      console.log(`   📸 Uploaded ${imageData.length} images to S3`);

      // Create draft product
      await this.productService.createDraftProductFromAnalysis(
        group.messageIds[0], // Use first message as primary
        messages[0].from!,
        messages[0].fromName || 'Unknown',
        analysisResult,
        imageData,
        group.productContext,
        group.messageIds // Pass all message IDs as source
      );

      console.log(`✅ Successfully processed group ${group.groupId}`);
    } catch (error) {
      console.error(`❌ Error processing group ${group.groupId}:`, error);
    }
  }

  /**
   * Fetch messages for a group
   */
  private async fetchGroupMessages(messageIds: string[]) {
    console.log(
      `   📥 Fetching ${messageIds.length} messages from database...`
    );

    return await prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Check if group is already processed
   */
  private async isGroupAlreadyProcessed(
    messageIds: string[]
  ): Promise<boolean> {
    const existingDrafts = await prisma.waDraftProduct.findMany({
      where: { messageId: { in: messageIds } },
    });
    return existingDrafts.length > 0;
  }

  /**
   * Extract text content from messages
   */
  private extractTextContent(messages: any[]): string[] {
    return messages
      .filter(msg => msg.text && msg.text.trim())
      .map(msg => msg.text!.trim());
  }
}
