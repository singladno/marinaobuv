import { ImageProcessingService } from '../services/image-processing-service';
import type { MessageGroup } from '../services/message-grouping-service';
import { ProductCreationService } from '../services/product-creation-service';
import { UnifiedAnalysisService } from '../services/unified-analysis-service';

import { MessageProcessor } from './MessageProcessor';

export class GroupProcessor {
  private analysisService: UnifiedAnalysisService;
  private imageService: ImageProcessingService;
  private productService: ProductCreationService;
  private messageProcessor: MessageProcessor;

  constructor() {
    this.analysisService = new UnifiedAnalysisService();
    this.imageService = new ImageProcessingService();
    this.productService = new ProductCreationService();
    this.messageProcessor = new MessageProcessor();
  }

  /**
   * Process a single message group
   */
  async processGroup(
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
      const messages = await this.messageProcessor.fetchGroupMessages(
        group.messageIds
      );
      if (messages.length === 0) {
        console.log(`   ⚠️  No messages found for group ${group.groupId}`);
        return;
      }

      // Check if already processed
      if (
        await this.messageProcessor.isGroupAlreadyProcessed(group.messageIds)
      ) {
        console.log(
          `   ⏭️  Draft products already exist for group ${group.groupId}`
        );
        return;
      }

      // Extract text content first
      const textContents = this.messageProcessor.extractTextContent(messages);
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
      await this.productService.createDraftProductFromAnalysis({
        messageId: group.messageIds[0],
        from: messages[0].from || '',
        fromName: messages[0].fromName || 'Unknown',
        analysis: analysisResult,
        images: imageData,
        context: group.productContext,
        sourceMessageIds: group.messageIds,
      });

      console.log(`✅ Successfully processed group ${group.groupId}`);
    } catch (error) {
      console.error(`❌ Error processing group ${group.groupId}:`, error);
    }
  }
}
